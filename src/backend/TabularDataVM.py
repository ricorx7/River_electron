import zerorpc
import datetime
import logging


class TabularDataVM(object):
    """
    Create a ViewModel for the Tabular View.
    This will handle all the data to view on the view in Electron.
    Zerorpc passes the data between the python and nodejs code.
    """

    def __init__(self):
        """
        Initialize the values.
        """
        self.ens_num = 0

    def ensemble_info(self, subsystem: int):
        """
        Retrieve the ensemble data from the view.  The view
        will call the zerorpc to get the latest ensemble data.  The
        latest ensemble data will be passed as a dictionary to the nodejs code.
        The nodejs code will have an interface that describes the same data.

        :param subsystem:  Currently not used, just use 0 for now.
        :return: Ensemble data as a dictionary.
        """
        self.ens_num += 1

        # Create a dictonary with all the ensemble data
        ens_info = {
            "ensembleNum": self.ens_num,
            "ensembleDateTimeStr": datetime.datetime.now().isoformat()
        }

        logging.info("Ensemble Info Request: " + str(self.ens_num))
        return ens_info

    def run_server(self, port: int = 4242):
        """
        Start a zerorpc server.  The server will share the data between
        this python code and the electron display.

        Each RPC server ViewModel will have a different port number.
        :param port: Port number for the zerorpc. DEFAULT: 4242
        :return:
        """
        s = zerorpc.Server(self)
        zerorpcIP = "tcp://0.0.0.0:" + str(port)
        s.bind(zerorpcIP)
        s.run()
