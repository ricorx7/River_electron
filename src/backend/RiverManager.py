from TabularDataVM import TabularDataVM
from threading import Thread
import logging


class RiverManager:
    """
    Handle all the ViewModels in the display.
    Starts the threads for each ViewModel and the thread for the ADCP.
    """

    def __init__(self):
        """
        Initialize the threads for the ViewModels and ADCP
        """
        # Start the TabularData
        self.tabular = TabularDataVM()
        self.tabular_thread = Thread(target=self.tabular.run_server, args=(4242,), name="TabularVM Thread")
        self.tabular_thread.start()
        logging.info("Tabular Thread started")


if __name__ == '__main__':
    format = "%(asctime)s: %(message)s"
    logging.basicConfig(format=format, level=logging.INFO,
                        datefmt="%H:%M:%S")

    RiverManager()
