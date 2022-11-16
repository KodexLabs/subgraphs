import { ByteArray } from '@graphprotocol/graph-ts';
import { byteArrayFromHex } from '../utils';

export const ROOT_NODE: string = '0x0000000000000000000000000000000000000000000000000000000000000000';
export const EMPTY_ADDRESS: string = '0x0000000000000000000000000000000000000000';

export const REGISTRATION_DOMAIN_ROOT_NONE: ByteArray = byteArrayFromHex('93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae');

export const REGISTRATION_KODEX_SUFFIX_CORE: string = 'd00dfeeddeadbeef6b6f646578';

export const NAME_BY_HASH_DEFAULT: string | null = null;
