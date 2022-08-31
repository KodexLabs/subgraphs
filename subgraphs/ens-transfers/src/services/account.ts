import { Address } from '@graphprotocol/graph-ts';
import { Account } from '../../generated/schema';

export function fetchAccount(address: Address): Account {
	const account = new Account(address.toHexString());
	account.save();
	return account;
}
