import logging
import math
import mmh3

log = logging.getLogger(__name__)

class BloomFilter:
    '''
    Python implementation of Bloom filters
    '''

    def __init__(self, capacity, error_rate):
        '''
        Initializes a Bloom filter with a given capacity and error rate
        '''
        self.capacity = capacity # maximum number of elements that can be stored
        self.error_rate = error_rate # desired maximum false positive rate
        self.num_bits = self.get_num_bits(capacity, error_rate) # number of bits needed
        self.num_hashes = self.get_num_hashes(self.num_bits, capacity) # number of hash functions needed
        self.bit_array = [0] * self.num_bits # bit array to store the elements

        log.info("Created Bloom filter with:")
        log.info("Capacity: %d", self.capacity)
        log.info("Error rate: %f", self.error_rate)
        log.info("Number of bits: %d", self.num_bits)
        log.info("Number of hash functions: %d", self.num_hashes)


    def add(self, element):
        for i in range(self.num_hashes):
            # generates a hash value for the element and sets the corresponding bit to 1
            hash_val = mmh3.hash(element, i) % self.num_bits
            self.bit_array[hash_val] = 1

    def __contains__(self, element):
        for i in range(self.num_hashes):
            # generates a hash value for the element and checks if the corresponding bit is 1
            hash_val = mmh3.hash(element, i) % self.num_bits
            if self.bit_array[hash_val] == 0:
                # if any of the bits is 0, the element is definitely not present
                return False
        # if all the bits are 1, the element may or may not be present
        return True

    def get_num_bits(self, capacity, error_rate):
        '''
        Calculates the number of bits needed for a given capacity and error rate
        '''
        num_bits = - (capacity * math.log(error_rate)) / (math.log(2) ** 2)
        return int(num_bits)

    def get_num_hashes(self, num_bits, capacity):
        '''
        Calculates the number of hash functions needed for a given number of bits and capacity
        '''
        num_hashes = (num_bits / capacity) * math.log(2)
        return int(num_hashes)
