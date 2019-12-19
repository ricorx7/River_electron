import zerorpc
import logging
import math
from threading import Thread, Event
from collections import deque
from rti_python.Ensemble.EnsembleData import Ensemble
from rti_python.Utilities.qa_qc import EnsembleQC
from AmplitudeVM import AmplitudeVM
from ContourVM import ContourVM
from TabularDataVM import TabularDataVM
from ShipTrackVM import ShipTrackVM
from TimeSeriesVM import TimeSeriesVM
from AdcpTerminal import AdcpTerminalVM
from rti_python.Utilities.config import RtiConfig
from rti_python.Codecs.AdcpCodec import AdcpCodec
from ZeroRpcManager import ZeroRpcManager


class DataManager:

    def __init__(self):

        # RTI Config file
        self.rti_config = RtiConfig()
        self.rti_config.init_terminal_config()                  # Terminal Options
        self.rti_config.init_timeseries_plot_config()           # Time Series Options

        self.adcp_codec = AdcpCodec()
        self.adcp_codec.ensemble_event += self.handle_ensemble_data

        self.tabular_vm = TabularDataVM()
        self.amp_vm = AmplitudeVM()
        self.contour_vm = ContourVM()
        self.shiptrack_vm = ShipTrackVM()
        self.timeseries_vm = TimeSeriesVM(rti_config=self.rti_config)
        self.adcp_terminal = AdcpTerminalVM(self.rti_config)
        self.adcp_terminal.on_serial_data += self.handle_adcp_serial_data

        # ZeroRPC Manager and Thread
        self.zero_rpc = ZeroRpcManager(rti_config=self.rti_config,
                                       data_mgr=self,
                                       tabular_vm=self.tabular_vm,
                                       amp_vm=self.amp_vm,
                                       contour_vm=self.contour_vm,
                                       shiptrack_vm=self.shiptrack_vm,
                                       timeseries_vm=self.timeseries_vm,
                                       adcp_terminal=self.adcp_terminal)
        self.zero_rpc_thread = Thread(name="ZeroRPC", target=self.zero_rpc.run_server, args=(4241,))

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
        self.zero_rpc_thread.start()

    def shutdown(self):
        """
        Shutdown the object.
        :return:
        """
        # Shutdown the Ensemble thread
        self.ens_thread_alive = False
        self.ens_thread_event.set()

    def handle_adcp_serial_data(self, sender, data):
        """
        Receive raw serial data from the serial port.
        Pass the data to the codec to be processed.
        :param sender: Not Used.
        :param data: Raw ensemble binary data.
        :return:
        """
        logging.info("DataManager: Serial Data Received")
        self.adcp_codec.add(data)

    def handle_ensemble_data(self, sender, ens):
        """
        Receiver data from the codec and process it by passing it
        to the data manager incoming ensemble.
        :param sender:Not Used
        :param ens: Ensemble from codec
        :return:
        """
        self.incoming_ens(ens)

    def incoming_ens(self, ens: Ensemble):
        """
        Handle all incoming data to be displayed.
        Put the data in a queue then wakeup the thread.
        :param ens: Ensemble to be displayed.
        :return:
        """
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

                # Screen the data

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

                        # Pass data to Time Series plot VM
                        self.timeseries_vm.set_ens(ens)

            # Reset the event
            self.ens_thread_event.clear()
