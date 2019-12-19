import zerorpc
import logging
from typing import List
from threading import Thread
from PlaybackManager import PlaybackManager
from rti_python.Utilities.config import RtiConfig
from AmplitudeVM import AmplitudeVM
from ContourVM import ContourVM
from TabularDataVM import TabularDataVM
from ShipTrackVM import ShipTrackVM
from TimeSeriesVM import TimeSeriesVM
from AdcpTerminal import AdcpTerminalVM


class ZeroRpcManager:

    def __init__(self,
                 rti_config: RtiConfig,
                 data_mgr,
                 tabular_vm: TabularDataVM,
                 amp_vm: AmplitudeVM,
                 contour_vm: ContourVM,
                 shiptrack_vm: ShipTrackVM,
                 timeseries_vm: TimeSeriesVM,
                 adcp_terminal: AdcpTerminalVM):

        # RTI Configuration
        self.rti_config = rti_config

        # Set the ViewModels
        self.data_mgr = data_mgr
        self.tabular_vm = tabular_vm
        self.amp_vm = amp_vm
        self.contour_vm = contour_vm
        self.shiptrack_vm = shiptrack_vm
        self.timeseries_vm = timeseries_vm
        self.adcp_terminal = adcp_terminal

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

            # Reset VM plots
            self.reset_vm()

            # Run a thread to playback the file
            playback_mgr = PlaybackManager(self.data_mgr)
            thread = Thread(name="AdcpDataManager Playback Thread", target=playback_mgr.playback_thread,
                            args=(files,))
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

    def zerorpc_set_timeseries_options(self,
                                       is_boat_speed: bool,
                                       is_boat_dir: bool,
                                       is_heading: bool,
                                       is_pitch: bool,
                                       is_roll: bool,
                                       is_temp: bool,
                                       is_gnss_qual: bool,
                                       is_gnss_hdop: bool,
                                       is_num_sats: bool,
                                       is_water_speed: bool,
                                       is_water_dir: bool,
                                       max_ens: int):
        """
        Set the Time Series Options.
        :param is_boat_speed: Flag if Boat Speed Plot is selected.
        :param is_boat_dir: Flag if Boat Direction Plot is selected.
        :param is_heading: Flag if Heading Plot is selected.
        :param is_pitch: Flag if Pitch Plot is selected.
        :param is_roll: Flag if Roll Plot is selected.
        :param is_temp: Flag if Temperature Plot is selected.
        :param is_gnss_qual: Flag if GNS Quality Inidicator Plot is selected.
        :param is_gnss_hdop: Flag if GNSS HDOP Plot is selected.
        :param is_num_sats: Flag if Number of GNSS Sat Plot is selected.
        :param is_water_speed: Flag if Water Speed Plot is selected.
        :param is_water_dir: Flag if Water Direction Plot is selected.
        :param max_ens: Number of ensembles in time series.
        :return:
        """

        logging.info("Time Series Option Request")
        return self.timeseries_vm.set_options(is_boat_speed,
                                               is_boat_dir,
                                               is_heading,
                                               is_pitch,
                                               is_roll,
                                               is_temp,
                                               is_gnss_qual,
                                               is_gnss_hdop,
                                               is_num_sats,
                                               is_water_speed,
                                               is_water_dir,
                                               max_ens)

    def zerorpc_get_timeseries_options(self):
        """
        Get the latest TimeSeries options.
        :return:
        """
        logging.info("Time Series Options Request")
        return self.timeseries_vm.get_options()

    def zerorpc_timeseries_plot(self):
        """
        Get the latest TimeSeries data.
        :return:
        """
        logging.info("Time Series Data Request")
        return self.timeseries_vm.get_data()

    def zerorpc_reset_plots(self, subsystem: int):
        """
        Get the latest amplitude data.
        :param subsystem: Subsystem number.
        :return:
        """
        logging.info("Reset Plots Request")
        return self.reset_vm()

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

    def zerorpc_bulk_cmd_adcp_serial_port(self, bulk_cmds: str):
        """
        Send Bulk commands to serial port.
        Each command is separated by a new line.
        :param bulk_cmds: Commands.  One command per line.
        :return:
        """
        logging.info("Send Bulk Commds: " + bulk_cmds)
        return self.adcp_terminal.send_bulk_cmd(bulk_cmds)

    def zerorpc_clear_adcp_serial(self):
        logging.info("Clear Console")
        self.adcp_terminal.clear_console()

    def reset_vm(self):
        """
        Reset the ViewModels.
        :return:
        """
        # Reset the plot when playback is called again
        if self.contour_vm:
            self.contour_vm.reset()
        if self.tabular_vm:
            self.tabular_vm.reset()
        if self.shiptrack_vm:
            self.shiptrack_vm.reset()
        if self.timeseries_vm:
            self.timeseries_vm.reset()

