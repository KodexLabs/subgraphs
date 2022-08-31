import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';
import { IERC721 } from '../../generated/BaseRegistrar/IERC721';
import { Account, ERC721Contract, ERC721Operator, ERC721Token } from '../../generated/schema';
import { fetchAccount } from './account';
import { supportsInterface } from './erc165';

export function fetchERC721(address: Address): ERC721Contract | null {
	const erc721 = IERC721.bind(address);

	// Try load entry
	let contract = ERC721Contract.load(address.toHexString());
	if (contract !== null) {
		return contract;
	}

	// Detect using ERC165
	const detectionId = address.concat(Bytes.fromHexString('80ac58cd')); // Address + ERC721
	let detectionAccount = Account.load(detectionId.toHexString());

	// On missing cache
	if (detectionAccount === null) {
		detectionAccount = new Account(detectionId.toHexString());
		const introspection_01ffc9a7 = supportsInterface(erc721, '01ffc9a7'); // ERC165
		const introspection_80ac58cd = supportsInterface(erc721, '80ac58cd'); // ERC721
		const introspection_00000000 = supportsInterface(erc721, '00000000', false);
		const isERC721 = introspection_01ffc9a7 && introspection_80ac58cd && introspection_00000000;
		detectionAccount.asERC721 = isERC721 ? address.toHexString() : null;
		detectionAccount.save();
	}

	// If an ERC721, build entry
	if (detectionAccount.asERC721) {
		contract = new ERC721Contract(address.toHexString());
		const try_name = erc721.try_name();
		const try_symbol = erc721.try_symbol();
		contract.name = try_name.reverted ? '' : try_name.value;
		contract.symbol = try_symbol.reverted ? '' : try_symbol.value;
		contract.supportsMetadata = supportsInterface(erc721, '5b5e139f'); // ERC721Metadata
		contract.asAccount = address.toHexString();
		contract.save();

		const account = fetchAccount(address);
		account.asERC721 = address.toHexString();
		account.save();
	}

	return contract;
}

export function fetchERC721Token(contract: ERC721Contract, identifier: BigInt): ERC721Token {
	const id = contract.id.concat('/').concat(identifier.toHex());
	let token = ERC721Token.load(id);

	if (token === null) {
		token = new ERC721Token(id);
		token.contract = contract.id;
		token.identifier = identifier;
		token.approval = fetchAccount(Address.zero()).id;

		if (contract.supportsMetadata) {
			const erc721 = IERC721.bind(Address.fromString(contract.id));
			const try_tokenURI = erc721.try_tokenURI(identifier);
			token.uri = try_tokenURI.reverted ? '' : try_tokenURI.value;
		}
	}

	return token as ERC721Token;
}

export function fetchERC721Operator(contract: ERC721Contract, owner: Account, operator: Account): ERC721Operator {
	const id = contract.id.concat('/').concat(owner.id).concat('/').concat(operator.id);
	let op = ERC721Operator.load(id);

	if (op === null) {
		op = new ERC721Operator(id);
		op.contract = contract.id;
		op.owner = owner.id;
		op.operator = operator.id;
	}

	return op as ERC721Operator;
}
