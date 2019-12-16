import zerorpc
import logging
import math
from typing import List
from threading import Thread, Event
from collections import deque
from rti_python.Ensemble.EnsembleData import Ensemble
from rti_python.Utilities.qa_qc import EnsembleQC
from PlaybackManager import PlaybackManager
from AmplitudeVM import AmplitudeVM
from ContourVM import ContourVM
from TabularDataVM import TabularDataVM
from ShipTrackVM import ShipTrackVM
from AdcpTerminal import AdcpTerminalVM
from rti_python.Utilities.config import RtiConfig


class DataManager:

    def __init__(self):

        self.rti_config = RtiConfig()
        self.rti_config.init_terminal_config()

        self.tabular_vm = TabularDataVM()
        self.amp_vm = AmplitudeVM()
        self.contour_vm = ContourVM()
        self.shiptrack_vm = ShipTrackVM()
        self.adcp_terminal = AdcpTerminalVM(self.rti_config)

        # Ensemble processing thread
        self.ens_thread_alive = True
        self.ens_queue = deque(maxlen=1000)
        self.ens_thread_event = Event()
        self.ens_thread = Thread(name="DataManager", target=self.ens_thread_run)

        # Used to remove vessel speed
        self.prev_bt_east = Ensemble.BadVelocity
        self.prev_bt_north = Ensemble.BadVelocity
        self.prev_bt_vert = Ensemble.BadVelocity

    def start(self, zerorpc_port: int):
        """
        Start the ensemble thread.  This thread
        handles all the incoming ensembles.
        :param zerorpc_port: zerorpc port.
        :return:
        """
        # Start the ens thread
        self.ens_thread.start()

        # Start the zerorpc thread
        self.run_server(zerorpc_port)

    def run_server(self, port: int = 4241):
        """
        Start a zerorpc server.  The server will share the data between
        this python code and the electron display.

        Each RPC server ViewModel will have a different port number.
        :param port: Port number for the zerorpc. DEFAULT: 4242
        :return:
        """
        s = zerorpc.Server(self)
        zerorpc_ip = "tcp://0.0.0.0:" + str(port)
        s.bind(zerorpc_ip)
        s.run()

    def zerorpc_playback_files(self, files: List[str]):
        """
        Playback the given files.  This will add all the data
        from the files into the codec.
        :param files: List of files.
        :return:
        """
        if files:
            logging.info("Loading files: " + str(files))

            # Reset the plot when playback is called again
            if self.contour_vm:
                self.contour_vm.reset()
            if self.tabular_vm:
                self.tabular_vm.reset()
            if self.shiptrack_vm:
                self.shiptrack_vm.reset()

            # Run a thread to playback the file
            playback_mgr = PlaybackManager(self)
            thread = Thread(name="AdcpDataManager Playback Thread", target=playback_mgr.playback_thread, args=(files,))
            thread.start()

    def zerorpc_tabular_data(self, subsystem: int):
        """
        Get the latest amplitude data.
        :param subsystem: Subsystem number.
        :return:
        """
        logging.info("Tabular Data Request")
        return self.tabular_vm.get_data()

    def zerorpc_amp_plot(self, subsystem: int):
        """
        Get the latest amplitude data.
        :param subsystem: Subsystem number.
        :return:
        """
        logging.info("Amp Data Request")
        return self.amp_vm.get_data()

    def zerorpc_shiptrack_plot(self, subsystem: int):
        """
        Get the latest ship track data.
        :param subsystem: Subsystem number.
        :return:
        """
        logging.info("Ship Track Data Request")
        return self.shiptrack_vm.get_data()

    def zerorpc_contour_plot(self, contour_type: str):
        """
        Get the latest amplitude data.
        Contour Types:
        mag, dir
        beam0, beam1, beam2, beam3
        amp, ampBeam0, ampBeam1, ampBeam2, ampBeam3, ampVert
        corr
        :param contour_type: Contour type.
        :return:
        """
        logging.info("Contour Data Request")
        return self.contour_vm.get_data("mag")

    def zerorpc_baud_rate_list(self):
        """
        Get the baud rate list.
        :return: Baud rate list.
        """
        logging.info("ADCP Terminal Baud Rate List Request")
        return self.adcp_terminal.baud_rate_list()

    def zerorpc_comm_port_list(self):
        """
        Get the baud rate list.
        :return: Baud rate list.
        """
        logging.info("ADCP Terminal Comm Port List Request")
        return self.adcp_terminal.comm_port_list()

    def zerorpc_adcp_terminal(self):
        """
        Get the terminal data.
        :return: Baud rate list.
        """
        logging.info("ADCP Terminal Data Request")
        return self.adcp_terminal.get_data()

    def zerorpc_connect_adcp_serial_port(self, comm_port: str, baud: int):
        """
        Get the terminal data.
        :return: Baud rate list.
        """
        logging.info("Connect Serial Port: " + str(comm_port) + ":" + str(baud))
        return self.adcp_terminal.connect_serial(comm_port, baud)

    def zerorpc_disconnect_adcp_serial_port(self):
        """
        Get the terminal data.
        :return: Baud rate list.
        """
        logging.info("Disconnect Serial Port")
        return self.adcp_terminal.disconnect_serial()

    def zerorpc_cmd_break_adcp_serial_port(self):
        """
        Get the terminal data.
        :return: Baud rate list.
        """
        logging.info("Send BREAK")
        return self.adcp_terminal.serial_break()

    def zerorpc_cmd_adcp_serial_port(self, cmd: str):
        """
        Get the terminal data.
        :return: Baud rate list.
        """
        logging.info("Send CMD: " + cmd)
        return self.adcp_terminal.send_cmd(cmd)

    def shutdown(self):
        """
        Shutdown the object.
        :return:
        """
        # Shutdown the Ensemble thread
        self.ens_thread_alive = False
        self.ens_thread_event.set()

    def incoming_ens(self, ens: Ensemble):
        # Add the data to the queue
        self.ens_queue.append(ens)

        # Wakeup the thread
        self.ens_thread_event.set()

    def ens_thread_run(self):
        """"
        Run a thread to handle the incoming ensemble data.
        Pass the data to the Waveforce codec and average water.
        """

        while self.ens_thread_alive:

            # Wait until the thread is awoken
            self.ens_thread_event.wait()

            # Check if data is in the queue
            while len(self.ens_queue) > 0:
                # Get the data from the queue
                ens = self.ens_queue.popleft()

                # QA QC the data
                EnsembleQC.scan_ensemble(ens)

                # Pass data
                if ens:
                    if ens.IsEnsembleData:
                        logging.info("AdcpDataManager: Process Ensemble: " + str(ens.EnsembleData.EnsembleNumber))

                        # Screen Data

                        # Pass Data to Tabular data
                        self.tabular_vm.set_ens(ens)

                        # Pass data to Amplitude plot VM
                        self.amp_vm.set_ens(ens)

                        # Pass data to Contour plot VM
                        self.contour_vm.set_ens(ens)

                        # Pass data to Ship Track plot VM
                        self.shiptrack_vm.set_ens(ens)

            # Reset the event
            self.ens_thread_event.clear()
