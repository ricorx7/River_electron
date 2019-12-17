import rti_python.Comm.adcp_serial_port as adcp_serial
import rti_python.Writer.rti_binary as RtiBinaryWriter
import threading
import time
import serial
import logging
from obsub import event
from threading import Lock
from rti_python.Utilities.config import RtiConfig


class AdcpTerminalVM:
    """
    Setup a view to monitor for waves data and covert it to MATLAB format for WaveForce AutoWaves.
    """

    def __init__(self, rti_config: RtiConfig):

        self.rti_config = rti_config
        self.rti_config.init_terminal_config()

        self.adcp = None
        self.adcp_thread = None
        self.adcp_thread_alive = False

        self.serial_recorder = None
        self.is_recording = False
        self.bytesWrittenLabel = 0
        self.totalBytesWrittenLabel = 0
        self.bytesWrittenLabel = ""

        self.MAX_SERIAL_CONSOLE_LEN = 9000

        self.serialTextBrowser = ""

        self.thread_lock = Lock()

    def comm_port_list(self):
        """
        Ste the serial ports to the list.
        :return:
        """
        # Add all the found serial ports
        return adcp_serial.get_serial_ports()

    def baud_rate_list(self):
        """
        Set the baud rates to the list.
        :return:
        """
        return adcp_serial.get_baud_rates()

    def get_data(self):

        # Lock the object
        self.thread_lock.acquire()

        is_connected = False
        if self.adcp:
            is_connected = True

        term_data = {
            "isConnected": is_connected,
            "termData": self.serialTextBrowser,
            "baud": self.rti_config.config['Comm']['Baud'],
            "commPort": self.rti_config.config['Comm']['Port']
        }

        # Release lock
        self.thread_lock.release()

        logging.info(term_data)

        return term_data

    def connect_serial(self, port, baud):
        """
        Connect the serial port and the read thread.
        :return:
        """
        logging.info("Serial Connect: " + port + " : " + str(baud))
        self.serialTextBrowser += "Serial Connect: " + port + " : " + str(baud)

        # Store the configuration
        self.rti_config.config['Comm']['Port'] = port
        self.rti_config.config['Comm']['Baud'] = str(baud)
        self.rti_config.write()

        try:
            self.adcp = adcp_serial.AdcpSerialPort(port, baud)
        except ValueError as ve:
            self.serialTextBrowser += "Error opening serial port. " + str(ve)
            logging.error("Error opening serial port. " + str(ve))
            return
        except serial.SerialException as se:
            self.serialTextBrowser += "Error opening serial port. " + str(se)
            logging.error("Error opening serial port. " + str(se))
            return
        except Exception as e:
            self.serialTextBrowser += "Error opening serial port. " + str(e)
            logging.error("Error opening serial port. " + str(e))
            return

        # Start the read thread
        self.adcp_thread_alive = True
        self.adcp_thread = threading.Thread(name="Serial Terminal Thread", target=thread_worker, args=(self,))
        self.adcp_thread.start()

    def disconnect_serial(self):
        """
        Disconnect the serial port and stop the read thread.
        :return:
        """
        self.adcp_thread_alive = False

        if self.adcp:
            self.adcp.disconnect()
            self.adcp = None

        self.serialTextBrowser += "Serial Disconnect."
        logging.info("Serial Disconnect")

    def serial_break(self):
        """
        Send a BREAK to the serial port.
        :return:
        """
        # Clear the display
        self.serialTextBrowser = ""

        # Send a BREAK
        if self.adcp:
            self.adcp.send_break(1.25)
            logging.info("BREAK SENT")

    def send_cmd(self, cmd: str):
        """
        Send a command to the ADCP.
        :return:
        """
        if self.adcp:
            if len(cmd) > 0:
                self.adcp.send_cmd(cmd)
                logging.info("Write to serial port: " + cmd)

    def start_pinging(self):
        """
        Send the command to start pinging.
        :return:
        """
        if self.adcp:
            self.adcp.start_pinging()
            logging.info("Start Pinging")

    def stop_pinging(self):
        """
        Send the command to stop pinging.
        :return:
        """
        if self.adcp:
            self.serialTextBrowser = ""
            self.adcp.stop_pinging()
            logging.info("Stop Pinging")

    def fix_adcp_comm(self):
        """
        If the ADCP stops communicating, try to fix the ADCP and regain communication.
        :return:
        """
        if self.adcp:
            # Send a BREAK
            self.adcp.send_break(1.25)

            # Wait
            time.sleep(1.0)

            # Send a STOP
            self.adcp.stop_pinging()

            time.sleep(1.0)

            # Send command to start pinging
            self.adcp.start_pinging()
        else:
            logging.error("ADCP is not connected.")

    def shutdown(self):
        """
        Shutdown the VM.
        :return:
        """
        logging.debug("Shutdown Terminal VM")
        self.disconnect_serial()

        if self.serial_recorder:
            self.serial_recorder.close()

    def turn_on_off_record(self):
        if self.is_reocording:
            self.serial_recorder = RtiBinaryWriter.RtiBinaryWriter(folder_path=self.rti_config.config['Comm']['output_dir'])
            logging.debug("Start Recording")
        else:
            if self.serial_recorder:
                self.serial_recorder.close()
                logging.debug("Stop Recording")
            self.serial_recorder = None

    def record_data(self, data):
        if self.serial_recorder:
            self.serial_recorder.write(data)

    def update_record_count(self, file_count, total_count, file_path):
        """
        Update the recording file sizes.
        :param file_count: Total file size of current file.
        :param total_count: Total size of all files written.
        :param file_path: Path of current filr.
        :return:
        """
        self.bytesWrittenLabel = str(file_count)
        self.totalBytesWrittenLabel = str(total_count)
        self.bytesWrittenLabel = file_path

    def clear_console(self):
        self.serialTextBrowser = ""

    def clear_bulk_cmd(self):
        self.bulkCmdMlainTextEdit = ""

    def send_bulk_cmd(self, bulk_cmds: str):
        cmds = bulk_cmds.splitlines()
        for cmd in cmds:
            self.adcp.send_cmd(cmd + "\n")
            logging.debug("Write to serial port: " + cmd)
            time.sleep(0.25)

    @event
    def on_serial_data(self, data):
        """
        Subscribe to receive serial data.
        :param data: Data from the serial port.
        :return:
        """
        logging.info("Data Received")

def thread_worker(vm):
    """
    Thread worker to handle reading the serial port.
    :param vm: This VM to get access to the variables.
    :return:
    """
    while vm.adcp_thread_alive:
        try:
            if vm.adcp.raw_serial.in_waiting:
                # Read the data from the serial port
                data = vm.adcp.read(vm.adcp.raw_serial.in_waiting)

                try:
                    # Display the data as ASCII if it is a response from the ADCP
                    # If it is raw binary ADCP data, this will fail so just display binary data
                    ascii_data = data.decode('ascii')
                    vm.serialTextBrowser += ascii_data

                    logging.debug(ascii_data)
                except Exception:
                    # Do nothing
                    vm.serialTextBrowser += str(data)

                # Prevent overflow of buffer, if greater than buffer limit
                # Get the last bytes in buffer
                if len(vm.serialTextBrowser) > 5000:
                    vm.serialTextBrowser = vm.serialTextBrowser[-5000]

                # Record data if turned on
                vm.record_data(data)

                # Publish the data
                vm.on_serial_data(data)

            time.sleep(0.01)
        except serial.SerialException as se:
            logging.error("Error using the serial port.\n" + str(se))
            vm.disconnect_serial()
        except Exception as ex:
            logging.error("Error processing the data.\n" + str(ex))