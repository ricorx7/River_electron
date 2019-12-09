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

class DataManager:

    def __init__(self, tabular_vm):
        self.tabular_vm = tabular_vm
        self.amp_vm = AmplitudeVM()

        # Ensemble processing thread
        self.ens_thread_alive = True
        self.ens_queue = deque(maxlen=1000)
        self.ens_thread_event = Event()
        self.ens_thread = Thread(name="DataManager", target=self.ens_thread_run)

        self.test_value = 1
        self.test_val_inc = 0.01

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

            # Run a thread to playback the file
            playback_mgr = PlaybackManager(self)
            thread = Thread(name="AdcpDataManager Playback Thread", target=playback_mgr.playback_thread, args=(files,))
            thread.start()

    def zerorpc_amp_plot(self, subsystem: int):
        """
        Get the latest amplitude data.
        :param subsystem: Subsystem number.
        :return:
        """
        logging.info("Amp Data Request")
        return self.amp_vm.get_data()

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

                        # Pass Data to Tabular data
                        self.tabular_vm.set_ens(ens)

                        # Pass data to Amplitude plot VM
                        self.amp_vm.set_ens(ens)

            # Reset the event
            self.ens_thread_event.clear()
