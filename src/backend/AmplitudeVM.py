from threading import Lock
import logging
from rti_python.Ensemble.Ensemble import Ensemble


class AmplitudeVM:

    def __init__(self):
        self.NumBeams = 4
        self.NumBins = 0
        self.BinData = []
        self.Beam0Data = []
        self.Beam1Data = []
        self.Beam2Data = []
        self.Beam3Data = []
        self.IsVertAvail = False
        self.VertData = []
        self.IsUpward = False
        self.MinBinDepth = 0.0
        self.MaxBinDepth = 0.0
        self.thread_lock = Lock()

    def set_ens(self, ens: Ensemble):
        """
        Get the data out of the ensemble and populate
        the structure.

        Lock and unlock when getting the data to ensure
        when new data is received, it is not being used with
        old data.
        :param ens: Latest ensemble.
        :return:
        """
        # Lock the object
        self.thread_lock.acquire()

        # Get the number of beams
        if ens.IsEnsembleData:
            self.NumBeams = ens.EnsembleData.NumBeams

        # Set if Upward or downward
        if ens.IsAncillaryData:
            self.IsUpward = ens.AncillaryData.is_upward_facing()

        # Create the Bin array
        if self.NumBins != ens.EnsembleData.NumBins:
            # Set the number of bins
            self.NumBins = ens.EnsembleData.NumBins

            # Clear the current array
            self.BinData.clear()
            self.Beam0Data.clear()
            self.Beam1Data.clear()
            self.Beam2Data.clear()
            self.Beam3Data.clear()

            # Set the new bin data
            for bin_num in range(ens.EnsembleData.NumBins):
                self.BinData.append(bin_num)
                # Init the beam data
                self.Beam0Data.append(0)
                self.Beam1Data.append(0)
                self.Beam2Data.append(0)
                self.Beam3Data.append(0)

        # Get Min and max bin depth
        self.MinBinDepth = ens.AncillaryData.FirstBinRange
        self.MaxBinDepth = ens.AncillaryData.FirstBinRange + (ens.AncillaryData.BinSize * ens.EnsembleData.NumBins)

        # Set Data
        for bin_num in range(ens.EnsembleData.NumBins):
            # Beam 0
            if self.NumBeams > 0:
                if not Ensemble.is_bad_velocity(ens.Amplitude.Amplitude[bin_num][0]):
                    self.Beam0Data[bin_num] = ens.Amplitude.Amplitude[bin_num][0]
                else:
                    self.Beam0Data[bin_num] = 0.0
            # Beam 1
            if self.NumBeams > 1:
                if not Ensemble.is_bad_velocity(ens.Amplitude.Amplitude[bin_num][1]):
                    self.Beam1Data[bin_num] = ens.Amplitude.Amplitude[bin_num][1]
                else:
                    self.Beam1Data[bin_num] = 0.0
            # Beam 2
            if self.NumBeams > 2:
                if not Ensemble.is_bad_velocity(ens.Amplitude.Amplitude[bin_num][2]):
                    self.Beam2Data[bin_num] = ens.Amplitude.Amplitude[bin_num][2]
                else:
                    self.Beam2Data[bin_num] = 0.0
            # Beam 3
            if self.NumBeams > 3:
                if not Ensemble.is_bad_velocity(ens.Amplitude.Amplitude[bin_num][3]):
                    self.Beam3Data[bin_num] = ens.Amplitude.Amplitude[bin_num][3]
                else:
                    self.Beam3Data[bin_num] = 0.0

        # Release the lock
        self.thread_lock.release()

    def get_data(self):
        """
        Populate the structure.

        Lock and unlock when getting the data to ensure
        when new data is received, it is not being used with
        old data.
        :return: Structure with all the latest ensemble data
        """

        # Lock the object
        self.thread_lock.acquire()

        # Populate the structure
        amp_data = {
            "numBeams": self.NumBeams,
            "numBins": self.NumBins,
            "binData": self.BinData,
            "beam0Data": self.Beam0Data,
            "beam1Data": self.Beam1Data,
            "beam2Data": self.Beam2Data,
            "beam3Data": self.Beam3Data,
            "isUpward": self.IsUpward,
            "minBinDepth": self.MinBinDepth,
            "maxBinDepth": self.MaxBinDepth,
            "isVertAvail": self.IsVertAvail,
            "vertData": self.VertData,
        }

        # Release the lock
        self.thread_lock.release()

        logging.debug(amp_data)

        return amp_data
