import logging
from rti_python.Codecs.BinaryCodec import BinaryCodec
from rti_python.Codecs.AdcpCodec import AdcpCodec


class PlaybackManager:

    def __init__(self, data_mgr):
        """
        Playback manager will open the files given and playback all the
        ensemble data.
        :param data_mgr: Data Manager to handle the incoming ensemble.
        """
        self.data_mgr = data_mgr
        self.adcp_codec = AdcpCodec()
        self.logger = logging.getLogger('root')

    def playback_thread(self, files):
        """
        Process of the files to playback.
        :param files: Files to playback.
        :return:
        """
        # Read the file
        for file in files:
            self.playback(file)

    def playback(self, file_path):
        """
        Playback the given file.  This will read the file
        then call ensemble_rcv to process the ensemble.
        :param file_path: Ensemble file path.
        :return:
        """
        # RTB ensemble delimiter
        DELIMITER = b'\x80' * 16

        BLOCK_SIZE = 4096

        # Create a buffer
        buff = bytes()

        with open(file_path, "rb") as f:

            self.logger.debug("Loading file: " + str(file_path))

            # Read in the file
            # for chunk in iter(lambda: f.read(4096), b''):
            #    self.adcp_codec.add(chunk)

            data = f.read(BLOCK_SIZE)  # Read in data

            while data:                                                 # Verify data was found
                buff += data                                            # Accumulate the buffer
                if DELIMITER in buff:                                   # Check for the delimiter
                    chunks = buff.split(DELIMITER)                      # If delimiter found, split to get the remaining buffer data
                    buff = chunks.pop()                                 # Put the remaining data back in the buffer

                    for chunk in chunks:                                # Take out the ens data
                        self.process_playback_ens(DELIMITER + chunk)    # Process the binary ensemble data

                data = f.read(BLOCK_SIZE)  # Read the next batch of data

                # Check if we need to shutdown
                #if not self.ens_thread_alive:
                #    return

        # Process whatever is remaining in the buffer
        self.process_playback_ens(DELIMITER + buff)

        # Close the file
        f.close()

    def process_playback_ens(self, ens_bin):
        # Verify the ENS data is good
        # This will check that all the data is there and the checksum is good
        if BinaryCodec.verify_ens_data(ens_bin):
            # Decode the ens binary data
            ens = BinaryCodec.decode_data_sets(ens_bin)

            # Pass the ensemble to the data manager
            if ens:
                self.data_mgr.incoming_ens(ens)
