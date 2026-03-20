import { GraphQLClient, RequestOptions } from 'graphql-request';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigDecimal: { input: any; output: any; }
  BigInt: { input: string; output: string; }
  Bytes: { input: string; output: string; }
  Int8: { input: any; output: any; }
  Timestamp: { input: any; output: any; }
};

export type Account = {
  __typename?: 'Account';
  id: Scalars['ID']['output'];
  occupiedCount: Scalars['Int']['output'];
  slotCount: Scalars['Int']['output'];
  slotsAsOccupant: Array<Slot>;
  slotsAsRecipient: Array<Slot>;
  type: AccountType;
};


export type AccountSlotsAsOccupantArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Slot_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Slot_Filter>;
};


export type AccountSlotsAsRecipientArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Slot_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Slot_Filter>;
};

export type AccountType =
  | 'CONTRACT'
  | 'DELEGATED'
  | 'EOA'
  | 'SPLIT';

export type Account_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Account_Filter>>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  occupiedCount?: InputMaybe<Scalars['Int']['input']>;
  occupiedCount_gt?: InputMaybe<Scalars['Int']['input']>;
  occupiedCount_gte?: InputMaybe<Scalars['Int']['input']>;
  occupiedCount_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  occupiedCount_lt?: InputMaybe<Scalars['Int']['input']>;
  occupiedCount_lte?: InputMaybe<Scalars['Int']['input']>;
  occupiedCount_not?: InputMaybe<Scalars['Int']['input']>;
  occupiedCount_not_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  or?: InputMaybe<Array<InputMaybe<Account_Filter>>>;
  slotCount?: InputMaybe<Scalars['Int']['input']>;
  slotCount_gt?: InputMaybe<Scalars['Int']['input']>;
  slotCount_gte?: InputMaybe<Scalars['Int']['input']>;
  slotCount_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  slotCount_lt?: InputMaybe<Scalars['Int']['input']>;
  slotCount_lte?: InputMaybe<Scalars['Int']['input']>;
  slotCount_not?: InputMaybe<Scalars['Int']['input']>;
  slotCount_not_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  slotsAsOccupant_?: InputMaybe<Slot_Filter>;
  slotsAsRecipient_?: InputMaybe<Slot_Filter>;
  type?: InputMaybe<AccountType>;
  type_in?: InputMaybe<Array<AccountType>>;
  type_not?: InputMaybe<AccountType>;
  type_not_in?: InputMaybe<Array<AccountType>>;
};

export type Account_OrderBy =
  | 'id'
  | 'occupiedCount'
  | 'slotCount'
  | 'slotsAsOccupant'
  | 'slotsAsRecipient'
  | 'type';

/** Indicates whether the current, partially filled bucket should be included in the response. Defaults to `exclude` */
export type Aggregation_Current =
  /** Exclude the current, partially filled bucket from the response */
  | 'exclude'
  /** Include the current, partially filled bucket in the response */
  | 'include';

export type Aggregation_Interval =
  | 'day'
  | 'hour';

export type BlockChangedFilter = {
  number_gte: Scalars['Int']['input'];
};

export type Block_Height = {
  hash?: InputMaybe<Scalars['Bytes']['input']>;
  number?: InputMaybe<Scalars['Int']['input']>;
  number_gte?: InputMaybe<Scalars['Int']['input']>;
};

export type BoughtEvent = {
  __typename?: 'BoughtEvent';
  blockNumber: Scalars['BigInt']['output'];
  buyer: Scalars['Bytes']['output'];
  currency: Currency;
  deposit: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  previousOccupant: Scalars['Bytes']['output'];
  price: Scalars['BigInt']['output'];
  selfAssessedPrice: Scalars['BigInt']['output'];
  slot: Slot;
  timestamp: Scalars['BigInt']['output'];
  tx: Scalars['Bytes']['output'];
};

export type BoughtEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<BoughtEvent_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  buyer?: InputMaybe<Scalars['Bytes']['input']>;
  buyer_contains?: InputMaybe<Scalars['Bytes']['input']>;
  buyer_gt?: InputMaybe<Scalars['Bytes']['input']>;
  buyer_gte?: InputMaybe<Scalars['Bytes']['input']>;
  buyer_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  buyer_lt?: InputMaybe<Scalars['Bytes']['input']>;
  buyer_lte?: InputMaybe<Scalars['Bytes']['input']>;
  buyer_not?: InputMaybe<Scalars['Bytes']['input']>;
  buyer_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  buyer_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  currency?: InputMaybe<Scalars['String']['input']>;
  currency_?: InputMaybe<Currency_Filter>;
  currency_contains?: InputMaybe<Scalars['String']['input']>;
  currency_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_gt?: InputMaybe<Scalars['String']['input']>;
  currency_gte?: InputMaybe<Scalars['String']['input']>;
  currency_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_lt?: InputMaybe<Scalars['String']['input']>;
  currency_lte?: InputMaybe<Scalars['String']['input']>;
  currency_not?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  deposit?: InputMaybe<Scalars['BigInt']['input']>;
  deposit_gt?: InputMaybe<Scalars['BigInt']['input']>;
  deposit_gte?: InputMaybe<Scalars['BigInt']['input']>;
  deposit_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  deposit_lt?: InputMaybe<Scalars['BigInt']['input']>;
  deposit_lte?: InputMaybe<Scalars['BigInt']['input']>;
  deposit_not?: InputMaybe<Scalars['BigInt']['input']>;
  deposit_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<BoughtEvent_Filter>>>;
  previousOccupant?: InputMaybe<Scalars['Bytes']['input']>;
  previousOccupant_contains?: InputMaybe<Scalars['Bytes']['input']>;
  previousOccupant_gt?: InputMaybe<Scalars['Bytes']['input']>;
  previousOccupant_gte?: InputMaybe<Scalars['Bytes']['input']>;
  previousOccupant_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  previousOccupant_lt?: InputMaybe<Scalars['Bytes']['input']>;
  previousOccupant_lte?: InputMaybe<Scalars['Bytes']['input']>;
  previousOccupant_not?: InputMaybe<Scalars['Bytes']['input']>;
  previousOccupant_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  previousOccupant_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  price?: InputMaybe<Scalars['BigInt']['input']>;
  price_gt?: InputMaybe<Scalars['BigInt']['input']>;
  price_gte?: InputMaybe<Scalars['BigInt']['input']>;
  price_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  price_lt?: InputMaybe<Scalars['BigInt']['input']>;
  price_lte?: InputMaybe<Scalars['BigInt']['input']>;
  price_not?: InputMaybe<Scalars['BigInt']['input']>;
  price_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  selfAssessedPrice?: InputMaybe<Scalars['BigInt']['input']>;
  selfAssessedPrice_gt?: InputMaybe<Scalars['BigInt']['input']>;
  selfAssessedPrice_gte?: InputMaybe<Scalars['BigInt']['input']>;
  selfAssessedPrice_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  selfAssessedPrice_lt?: InputMaybe<Scalars['BigInt']['input']>;
  selfAssessedPrice_lte?: InputMaybe<Scalars['BigInt']['input']>;
  selfAssessedPrice_not?: InputMaybe<Scalars['BigInt']['input']>;
  selfAssessedPrice_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  slot?: InputMaybe<Scalars['String']['input']>;
  slot_?: InputMaybe<Slot_Filter>;
  slot_contains?: InputMaybe<Scalars['String']['input']>;
  slot_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_gt?: InputMaybe<Scalars['String']['input']>;
  slot_gte?: InputMaybe<Scalars['String']['input']>;
  slot_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_lt?: InputMaybe<Scalars['String']['input']>;
  slot_lte?: InputMaybe<Scalars['String']['input']>;
  slot_not?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tx?: InputMaybe<Scalars['Bytes']['input']>;
  tx_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  tx_lt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_lte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export type BoughtEvent_OrderBy =
  | 'blockNumber'
  | 'buyer'
  | 'currency'
  | 'currency__decimals'
  | 'currency__id'
  | 'currency__name'
  | 'currency__symbol'
  | 'deposit'
  | 'id'
  | 'previousOccupant'
  | 'price'
  | 'selfAssessedPrice'
  | 'slot'
  | 'slot__collectedTax'
  | 'slot__createdAt'
  | 'slot__createdTx'
  | 'slot__deposit'
  | 'slot__id'
  | 'slot__liquidationBountyBps'
  | 'slot__manager'
  | 'slot__minDepositSeconds'
  | 'slot__mutableModule'
  | 'slot__mutableTax'
  | 'slot__occupant'
  | 'slot__price'
  | 'slot__recipient'
  | 'slot__taxPercentage'
  | 'slot__totalCollected'
  | 'slot__updatedAt'
  | 'timestamp'
  | 'tx';

export type Currency = {
  __typename?: 'Currency';
  decimals: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  symbol?: Maybe<Scalars['String']['output']>;
};

export type Currency_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Currency_Filter>>>;
  decimals?: InputMaybe<Scalars['Int']['input']>;
  decimals_gt?: InputMaybe<Scalars['Int']['input']>;
  decimals_gte?: InputMaybe<Scalars['Int']['input']>;
  decimals_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  decimals_lt?: InputMaybe<Scalars['Int']['input']>;
  decimals_lte?: InputMaybe<Scalars['Int']['input']>;
  decimals_not?: InputMaybe<Scalars['Int']['input']>;
  decimals_not_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  name?: InputMaybe<Scalars['String']['input']>;
  name_contains?: InputMaybe<Scalars['String']['input']>;
  name_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  name_ends_with?: InputMaybe<Scalars['String']['input']>;
  name_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  name_gt?: InputMaybe<Scalars['String']['input']>;
  name_gte?: InputMaybe<Scalars['String']['input']>;
  name_in?: InputMaybe<Array<Scalars['String']['input']>>;
  name_lt?: InputMaybe<Scalars['String']['input']>;
  name_lte?: InputMaybe<Scalars['String']['input']>;
  name_not?: InputMaybe<Scalars['String']['input']>;
  name_not_contains?: InputMaybe<Scalars['String']['input']>;
  name_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  name_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  name_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  name_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  name_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  name_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  name_starts_with?: InputMaybe<Scalars['String']['input']>;
  name_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  or?: InputMaybe<Array<InputMaybe<Currency_Filter>>>;
  symbol?: InputMaybe<Scalars['String']['input']>;
  symbol_contains?: InputMaybe<Scalars['String']['input']>;
  symbol_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  symbol_ends_with?: InputMaybe<Scalars['String']['input']>;
  symbol_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  symbol_gt?: InputMaybe<Scalars['String']['input']>;
  symbol_gte?: InputMaybe<Scalars['String']['input']>;
  symbol_in?: InputMaybe<Array<Scalars['String']['input']>>;
  symbol_lt?: InputMaybe<Scalars['String']['input']>;
  symbol_lte?: InputMaybe<Scalars['String']['input']>;
  symbol_not?: InputMaybe<Scalars['String']['input']>;
  symbol_not_contains?: InputMaybe<Scalars['String']['input']>;
  symbol_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  symbol_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  symbol_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  symbol_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  symbol_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  symbol_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  symbol_starts_with?: InputMaybe<Scalars['String']['input']>;
  symbol_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export type Currency_OrderBy =
  | 'decimals'
  | 'id'
  | 'name'
  | 'symbol';

export type DepositedEvent = {
  __typename?: 'DepositedEvent';
  amount: Scalars['BigInt']['output'];
  blockNumber: Scalars['BigInt']['output'];
  currency: Currency;
  depositor: Scalars['Bytes']['output'];
  id: Scalars['ID']['output'];
  slot: Slot;
  timestamp: Scalars['BigInt']['output'];
  tx: Scalars['Bytes']['output'];
};

export type DepositedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<DepositedEvent_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  currency?: InputMaybe<Scalars['String']['input']>;
  currency_?: InputMaybe<Currency_Filter>;
  currency_contains?: InputMaybe<Scalars['String']['input']>;
  currency_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_gt?: InputMaybe<Scalars['String']['input']>;
  currency_gte?: InputMaybe<Scalars['String']['input']>;
  currency_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_lt?: InputMaybe<Scalars['String']['input']>;
  currency_lte?: InputMaybe<Scalars['String']['input']>;
  currency_not?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  depositor?: InputMaybe<Scalars['Bytes']['input']>;
  depositor_contains?: InputMaybe<Scalars['Bytes']['input']>;
  depositor_gt?: InputMaybe<Scalars['Bytes']['input']>;
  depositor_gte?: InputMaybe<Scalars['Bytes']['input']>;
  depositor_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  depositor_lt?: InputMaybe<Scalars['Bytes']['input']>;
  depositor_lte?: InputMaybe<Scalars['Bytes']['input']>;
  depositor_not?: InputMaybe<Scalars['Bytes']['input']>;
  depositor_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  depositor_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<DepositedEvent_Filter>>>;
  slot?: InputMaybe<Scalars['String']['input']>;
  slot_?: InputMaybe<Slot_Filter>;
  slot_contains?: InputMaybe<Scalars['String']['input']>;
  slot_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_gt?: InputMaybe<Scalars['String']['input']>;
  slot_gte?: InputMaybe<Scalars['String']['input']>;
  slot_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_lt?: InputMaybe<Scalars['String']['input']>;
  slot_lte?: InputMaybe<Scalars['String']['input']>;
  slot_not?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tx?: InputMaybe<Scalars['Bytes']['input']>;
  tx_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  tx_lt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_lte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export type DepositedEvent_OrderBy =
  | 'amount'
  | 'blockNumber'
  | 'currency'
  | 'currency__decimals'
  | 'currency__id'
  | 'currency__name'
  | 'currency__symbol'
  | 'depositor'
  | 'id'
  | 'slot'
  | 'slot__collectedTax'
  | 'slot__createdAt'
  | 'slot__createdTx'
  | 'slot__deposit'
  | 'slot__id'
  | 'slot__liquidationBountyBps'
  | 'slot__manager'
  | 'slot__minDepositSeconds'
  | 'slot__mutableModule'
  | 'slot__mutableTax'
  | 'slot__occupant'
  | 'slot__price'
  | 'slot__recipient'
  | 'slot__taxPercentage'
  | 'slot__totalCollected'
  | 'slot__updatedAt'
  | 'timestamp'
  | 'tx';

export type Factory = {
  __typename?: 'Factory';
  id: Scalars['ID']['output'];
  modules: Array<Module>;
  slotCount: Scalars['BigInt']['output'];
};


export type FactoryModulesArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Module_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<Module_Filter>;
};

export type Factory_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Factory_Filter>>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  modules_?: InputMaybe<Module_Filter>;
  or?: InputMaybe<Array<InputMaybe<Factory_Filter>>>;
  slotCount?: InputMaybe<Scalars['BigInt']['input']>;
  slotCount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  slotCount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  slotCount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  slotCount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  slotCount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  slotCount_not?: InputMaybe<Scalars['BigInt']['input']>;
  slotCount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

export type Factory_OrderBy =
  | 'id'
  | 'modules'
  | 'slotCount';

export type LiquidatedEvent = {
  __typename?: 'LiquidatedEvent';
  blockNumber: Scalars['BigInt']['output'];
  bounty: Scalars['BigInt']['output'];
  currency: Currency;
  id: Scalars['ID']['output'];
  liquidator: Scalars['Bytes']['output'];
  occupant: Scalars['Bytes']['output'];
  slot: Slot;
  timestamp: Scalars['BigInt']['output'];
  tx: Scalars['Bytes']['output'];
};

export type LiquidatedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<LiquidatedEvent_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  bounty?: InputMaybe<Scalars['BigInt']['input']>;
  bounty_gt?: InputMaybe<Scalars['BigInt']['input']>;
  bounty_gte?: InputMaybe<Scalars['BigInt']['input']>;
  bounty_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  bounty_lt?: InputMaybe<Scalars['BigInt']['input']>;
  bounty_lte?: InputMaybe<Scalars['BigInt']['input']>;
  bounty_not?: InputMaybe<Scalars['BigInt']['input']>;
  bounty_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  currency?: InputMaybe<Scalars['String']['input']>;
  currency_?: InputMaybe<Currency_Filter>;
  currency_contains?: InputMaybe<Scalars['String']['input']>;
  currency_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_gt?: InputMaybe<Scalars['String']['input']>;
  currency_gte?: InputMaybe<Scalars['String']['input']>;
  currency_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_lt?: InputMaybe<Scalars['String']['input']>;
  currency_lte?: InputMaybe<Scalars['String']['input']>;
  currency_not?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  liquidator?: InputMaybe<Scalars['Bytes']['input']>;
  liquidator_contains?: InputMaybe<Scalars['Bytes']['input']>;
  liquidator_gt?: InputMaybe<Scalars['Bytes']['input']>;
  liquidator_gte?: InputMaybe<Scalars['Bytes']['input']>;
  liquidator_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  liquidator_lt?: InputMaybe<Scalars['Bytes']['input']>;
  liquidator_lte?: InputMaybe<Scalars['Bytes']['input']>;
  liquidator_not?: InputMaybe<Scalars['Bytes']['input']>;
  liquidator_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  liquidator_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  occupant?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_contains?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_gt?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_gte?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  occupant_lt?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_lte?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_not?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  or?: InputMaybe<Array<InputMaybe<LiquidatedEvent_Filter>>>;
  slot?: InputMaybe<Scalars['String']['input']>;
  slot_?: InputMaybe<Slot_Filter>;
  slot_contains?: InputMaybe<Scalars['String']['input']>;
  slot_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_gt?: InputMaybe<Scalars['String']['input']>;
  slot_gte?: InputMaybe<Scalars['String']['input']>;
  slot_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_lt?: InputMaybe<Scalars['String']['input']>;
  slot_lte?: InputMaybe<Scalars['String']['input']>;
  slot_not?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tx?: InputMaybe<Scalars['Bytes']['input']>;
  tx_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  tx_lt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_lte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export type LiquidatedEvent_OrderBy =
  | 'blockNumber'
  | 'bounty'
  | 'currency'
  | 'currency__decimals'
  | 'currency__id'
  | 'currency__name'
  | 'currency__symbol'
  | 'id'
  | 'liquidator'
  | 'occupant'
  | 'slot'
  | 'slot__collectedTax'
  | 'slot__createdAt'
  | 'slot__createdTx'
  | 'slot__deposit'
  | 'slot__id'
  | 'slot__liquidationBountyBps'
  | 'slot__manager'
  | 'slot__minDepositSeconds'
  | 'slot__mutableModule'
  | 'slot__mutableTax'
  | 'slot__occupant'
  | 'slot__price'
  | 'slot__recipient'
  | 'slot__taxPercentage'
  | 'slot__totalCollected'
  | 'slot__updatedAt'
  | 'timestamp'
  | 'tx';

export type MetadataSlot = {
  __typename?: 'MetadataSlot';
  adType?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['BigInt']['output'];
  createdTx: Scalars['Bytes']['output'];
  id: Scalars['ID']['output'];
  rawJson?: Maybe<Scalars['String']['output']>;
  slot: Slot;
  updateCount: Scalars['BigInt']['output'];
  updatedAt: Scalars['BigInt']['output'];
  updatedBy: Scalars['Bytes']['output'];
  updatedTx: Scalars['Bytes']['output'];
  uri: Scalars['String']['output'];
};

export type MetadataSlot_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  adType?: InputMaybe<Scalars['String']['input']>;
  adType_contains?: InputMaybe<Scalars['String']['input']>;
  adType_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  adType_ends_with?: InputMaybe<Scalars['String']['input']>;
  adType_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  adType_gt?: InputMaybe<Scalars['String']['input']>;
  adType_gte?: InputMaybe<Scalars['String']['input']>;
  adType_in?: InputMaybe<Array<Scalars['String']['input']>>;
  adType_lt?: InputMaybe<Scalars['String']['input']>;
  adType_lte?: InputMaybe<Scalars['String']['input']>;
  adType_not?: InputMaybe<Scalars['String']['input']>;
  adType_not_contains?: InputMaybe<Scalars['String']['input']>;
  adType_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  adType_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  adType_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  adType_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  adType_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  adType_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  adType_starts_with?: InputMaybe<Scalars['String']['input']>;
  adType_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  and?: InputMaybe<Array<InputMaybe<MetadataSlot_Filter>>>;
  createdAt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  createdAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  createdTx?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_contains?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_gt?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_gte?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  createdTx_lt?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_lte?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_not?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<MetadataSlot_Filter>>>;
  rawJson?: InputMaybe<Scalars['String']['input']>;
  rawJson_contains?: InputMaybe<Scalars['String']['input']>;
  rawJson_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  rawJson_ends_with?: InputMaybe<Scalars['String']['input']>;
  rawJson_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  rawJson_gt?: InputMaybe<Scalars['String']['input']>;
  rawJson_gte?: InputMaybe<Scalars['String']['input']>;
  rawJson_in?: InputMaybe<Array<Scalars['String']['input']>>;
  rawJson_lt?: InputMaybe<Scalars['String']['input']>;
  rawJson_lte?: InputMaybe<Scalars['String']['input']>;
  rawJson_not?: InputMaybe<Scalars['String']['input']>;
  rawJson_not_contains?: InputMaybe<Scalars['String']['input']>;
  rawJson_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  rawJson_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  rawJson_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  rawJson_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  rawJson_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  rawJson_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  rawJson_starts_with?: InputMaybe<Scalars['String']['input']>;
  rawJson_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot?: InputMaybe<Scalars['String']['input']>;
  slot_?: InputMaybe<Slot_Filter>;
  slot_contains?: InputMaybe<Scalars['String']['input']>;
  slot_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_gt?: InputMaybe<Scalars['String']['input']>;
  slot_gte?: InputMaybe<Scalars['String']['input']>;
  slot_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_lt?: InputMaybe<Scalars['String']['input']>;
  slot_lte?: InputMaybe<Scalars['String']['input']>;
  slot_not?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  updateCount?: InputMaybe<Scalars['BigInt']['input']>;
  updateCount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  updateCount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  updateCount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  updateCount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  updateCount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  updateCount_not?: InputMaybe<Scalars['BigInt']['input']>;
  updateCount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  updatedAt?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  updatedAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  updatedBy?: InputMaybe<Scalars['Bytes']['input']>;
  updatedBy_contains?: InputMaybe<Scalars['Bytes']['input']>;
  updatedBy_gt?: InputMaybe<Scalars['Bytes']['input']>;
  updatedBy_gte?: InputMaybe<Scalars['Bytes']['input']>;
  updatedBy_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  updatedBy_lt?: InputMaybe<Scalars['Bytes']['input']>;
  updatedBy_lte?: InputMaybe<Scalars['Bytes']['input']>;
  updatedBy_not?: InputMaybe<Scalars['Bytes']['input']>;
  updatedBy_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  updatedBy_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  updatedTx?: InputMaybe<Scalars['Bytes']['input']>;
  updatedTx_contains?: InputMaybe<Scalars['Bytes']['input']>;
  updatedTx_gt?: InputMaybe<Scalars['Bytes']['input']>;
  updatedTx_gte?: InputMaybe<Scalars['Bytes']['input']>;
  updatedTx_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  updatedTx_lt?: InputMaybe<Scalars['Bytes']['input']>;
  updatedTx_lte?: InputMaybe<Scalars['Bytes']['input']>;
  updatedTx_not?: InputMaybe<Scalars['Bytes']['input']>;
  updatedTx_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  updatedTx_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  uri?: InputMaybe<Scalars['String']['input']>;
  uri_contains?: InputMaybe<Scalars['String']['input']>;
  uri_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  uri_ends_with?: InputMaybe<Scalars['String']['input']>;
  uri_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  uri_gt?: InputMaybe<Scalars['String']['input']>;
  uri_gte?: InputMaybe<Scalars['String']['input']>;
  uri_in?: InputMaybe<Array<Scalars['String']['input']>>;
  uri_lt?: InputMaybe<Scalars['String']['input']>;
  uri_lte?: InputMaybe<Scalars['String']['input']>;
  uri_not?: InputMaybe<Scalars['String']['input']>;
  uri_not_contains?: InputMaybe<Scalars['String']['input']>;
  uri_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  uri_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  uri_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  uri_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  uri_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  uri_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  uri_starts_with?: InputMaybe<Scalars['String']['input']>;
  uri_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export type MetadataSlot_OrderBy =
  | 'adType'
  | 'createdAt'
  | 'createdTx'
  | 'id'
  | 'rawJson'
  | 'slot'
  | 'slot__collectedTax'
  | 'slot__createdAt'
  | 'slot__createdTx'
  | 'slot__deposit'
  | 'slot__id'
  | 'slot__liquidationBountyBps'
  | 'slot__manager'
  | 'slot__minDepositSeconds'
  | 'slot__mutableModule'
  | 'slot__mutableTax'
  | 'slot__occupant'
  | 'slot__price'
  | 'slot__recipient'
  | 'slot__taxPercentage'
  | 'slot__totalCollected'
  | 'slot__updatedAt'
  | 'updateCount'
  | 'updatedAt'
  | 'updatedBy'
  | 'updatedTx'
  | 'uri';

export type MetadataUpdatedEvent = {
  __typename?: 'MetadataUpdatedEvent';
  adType?: Maybe<Scalars['String']['output']>;
  author: Account;
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  rawJson?: Maybe<Scalars['String']['output']>;
  slot: Slot;
  timestamp: Scalars['BigInt']['output'];
  tx: Scalars['Bytes']['output'];
  uri: Scalars['String']['output'];
};

export type MetadataUpdatedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  adType?: InputMaybe<Scalars['String']['input']>;
  adType_contains?: InputMaybe<Scalars['String']['input']>;
  adType_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  adType_ends_with?: InputMaybe<Scalars['String']['input']>;
  adType_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  adType_gt?: InputMaybe<Scalars['String']['input']>;
  adType_gte?: InputMaybe<Scalars['String']['input']>;
  adType_in?: InputMaybe<Array<Scalars['String']['input']>>;
  adType_lt?: InputMaybe<Scalars['String']['input']>;
  adType_lte?: InputMaybe<Scalars['String']['input']>;
  adType_not?: InputMaybe<Scalars['String']['input']>;
  adType_not_contains?: InputMaybe<Scalars['String']['input']>;
  adType_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  adType_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  adType_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  adType_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  adType_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  adType_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  adType_starts_with?: InputMaybe<Scalars['String']['input']>;
  adType_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  and?: InputMaybe<Array<InputMaybe<MetadataUpdatedEvent_Filter>>>;
  author?: InputMaybe<Scalars['String']['input']>;
  author_?: InputMaybe<Account_Filter>;
  author_contains?: InputMaybe<Scalars['String']['input']>;
  author_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  author_ends_with?: InputMaybe<Scalars['String']['input']>;
  author_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  author_gt?: InputMaybe<Scalars['String']['input']>;
  author_gte?: InputMaybe<Scalars['String']['input']>;
  author_in?: InputMaybe<Array<Scalars['String']['input']>>;
  author_lt?: InputMaybe<Scalars['String']['input']>;
  author_lte?: InputMaybe<Scalars['String']['input']>;
  author_not?: InputMaybe<Scalars['String']['input']>;
  author_not_contains?: InputMaybe<Scalars['String']['input']>;
  author_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  author_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  author_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  author_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  author_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  author_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  author_starts_with?: InputMaybe<Scalars['String']['input']>;
  author_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<MetadataUpdatedEvent_Filter>>>;
  rawJson?: InputMaybe<Scalars['String']['input']>;
  rawJson_contains?: InputMaybe<Scalars['String']['input']>;
  rawJson_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  rawJson_ends_with?: InputMaybe<Scalars['String']['input']>;
  rawJson_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  rawJson_gt?: InputMaybe<Scalars['String']['input']>;
  rawJson_gte?: InputMaybe<Scalars['String']['input']>;
  rawJson_in?: InputMaybe<Array<Scalars['String']['input']>>;
  rawJson_lt?: InputMaybe<Scalars['String']['input']>;
  rawJson_lte?: InputMaybe<Scalars['String']['input']>;
  rawJson_not?: InputMaybe<Scalars['String']['input']>;
  rawJson_not_contains?: InputMaybe<Scalars['String']['input']>;
  rawJson_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  rawJson_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  rawJson_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  rawJson_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  rawJson_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  rawJson_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  rawJson_starts_with?: InputMaybe<Scalars['String']['input']>;
  rawJson_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot?: InputMaybe<Scalars['String']['input']>;
  slot_?: InputMaybe<Slot_Filter>;
  slot_contains?: InputMaybe<Scalars['String']['input']>;
  slot_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_gt?: InputMaybe<Scalars['String']['input']>;
  slot_gte?: InputMaybe<Scalars['String']['input']>;
  slot_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_lt?: InputMaybe<Scalars['String']['input']>;
  slot_lte?: InputMaybe<Scalars['String']['input']>;
  slot_not?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tx?: InputMaybe<Scalars['Bytes']['input']>;
  tx_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  tx_lt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_lte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  uri?: InputMaybe<Scalars['String']['input']>;
  uri_contains?: InputMaybe<Scalars['String']['input']>;
  uri_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  uri_ends_with?: InputMaybe<Scalars['String']['input']>;
  uri_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  uri_gt?: InputMaybe<Scalars['String']['input']>;
  uri_gte?: InputMaybe<Scalars['String']['input']>;
  uri_in?: InputMaybe<Array<Scalars['String']['input']>>;
  uri_lt?: InputMaybe<Scalars['String']['input']>;
  uri_lte?: InputMaybe<Scalars['String']['input']>;
  uri_not?: InputMaybe<Scalars['String']['input']>;
  uri_not_contains?: InputMaybe<Scalars['String']['input']>;
  uri_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  uri_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  uri_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  uri_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  uri_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  uri_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  uri_starts_with?: InputMaybe<Scalars['String']['input']>;
  uri_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export type MetadataUpdatedEvent_OrderBy =
  | 'adType'
  | 'author'
  | 'author__id'
  | 'author__occupiedCount'
  | 'author__slotCount'
  | 'author__type'
  | 'blockNumber'
  | 'id'
  | 'rawJson'
  | 'slot'
  | 'slot__collectedTax'
  | 'slot__createdAt'
  | 'slot__createdTx'
  | 'slot__deposit'
  | 'slot__id'
  | 'slot__liquidationBountyBps'
  | 'slot__manager'
  | 'slot__minDepositSeconds'
  | 'slot__mutableModule'
  | 'slot__mutableTax'
  | 'slot__occupant'
  | 'slot__price'
  | 'slot__recipient'
  | 'slot__taxPercentage'
  | 'slot__totalCollected'
  | 'slot__updatedAt'
  | 'timestamp'
  | 'tx'
  | 'uri';

export type Module = {
  __typename?: 'Module';
  factory: Factory;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  verified: Scalars['Boolean']['output'];
  version: Scalars['String']['output'];
};

export type ModuleUpdateProposedEvent = {
  __typename?: 'ModuleUpdateProposedEvent';
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  newModule: Scalars['Bytes']['output'];
  slot: Slot;
  timestamp: Scalars['BigInt']['output'];
  tx: Scalars['Bytes']['output'];
};

export type ModuleUpdateProposedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<ModuleUpdateProposedEvent_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  newModule?: InputMaybe<Scalars['Bytes']['input']>;
  newModule_contains?: InputMaybe<Scalars['Bytes']['input']>;
  newModule_gt?: InputMaybe<Scalars['Bytes']['input']>;
  newModule_gte?: InputMaybe<Scalars['Bytes']['input']>;
  newModule_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  newModule_lt?: InputMaybe<Scalars['Bytes']['input']>;
  newModule_lte?: InputMaybe<Scalars['Bytes']['input']>;
  newModule_not?: InputMaybe<Scalars['Bytes']['input']>;
  newModule_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  newModule_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  or?: InputMaybe<Array<InputMaybe<ModuleUpdateProposedEvent_Filter>>>;
  slot?: InputMaybe<Scalars['String']['input']>;
  slot_?: InputMaybe<Slot_Filter>;
  slot_contains?: InputMaybe<Scalars['String']['input']>;
  slot_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_gt?: InputMaybe<Scalars['String']['input']>;
  slot_gte?: InputMaybe<Scalars['String']['input']>;
  slot_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_lt?: InputMaybe<Scalars['String']['input']>;
  slot_lte?: InputMaybe<Scalars['String']['input']>;
  slot_not?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tx?: InputMaybe<Scalars['Bytes']['input']>;
  tx_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  tx_lt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_lte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export type ModuleUpdateProposedEvent_OrderBy =
  | 'blockNumber'
  | 'id'
  | 'newModule'
  | 'slot'
  | 'slot__collectedTax'
  | 'slot__createdAt'
  | 'slot__createdTx'
  | 'slot__deposit'
  | 'slot__id'
  | 'slot__liquidationBountyBps'
  | 'slot__manager'
  | 'slot__minDepositSeconds'
  | 'slot__mutableModule'
  | 'slot__mutableTax'
  | 'slot__occupant'
  | 'slot__price'
  | 'slot__recipient'
  | 'slot__taxPercentage'
  | 'slot__totalCollected'
  | 'slot__updatedAt'
  | 'timestamp'
  | 'tx';

export type Module_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Module_Filter>>>;
  factory?: InputMaybe<Scalars['String']['input']>;
  factory_?: InputMaybe<Factory_Filter>;
  factory_contains?: InputMaybe<Scalars['String']['input']>;
  factory_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  factory_ends_with?: InputMaybe<Scalars['String']['input']>;
  factory_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  factory_gt?: InputMaybe<Scalars['String']['input']>;
  factory_gte?: InputMaybe<Scalars['String']['input']>;
  factory_in?: InputMaybe<Array<Scalars['String']['input']>>;
  factory_lt?: InputMaybe<Scalars['String']['input']>;
  factory_lte?: InputMaybe<Scalars['String']['input']>;
  factory_not?: InputMaybe<Scalars['String']['input']>;
  factory_not_contains?: InputMaybe<Scalars['String']['input']>;
  factory_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  factory_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  factory_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  factory_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  factory_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  factory_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  factory_starts_with?: InputMaybe<Scalars['String']['input']>;
  factory_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  name?: InputMaybe<Scalars['String']['input']>;
  name_contains?: InputMaybe<Scalars['String']['input']>;
  name_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  name_ends_with?: InputMaybe<Scalars['String']['input']>;
  name_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  name_gt?: InputMaybe<Scalars['String']['input']>;
  name_gte?: InputMaybe<Scalars['String']['input']>;
  name_in?: InputMaybe<Array<Scalars['String']['input']>>;
  name_lt?: InputMaybe<Scalars['String']['input']>;
  name_lte?: InputMaybe<Scalars['String']['input']>;
  name_not?: InputMaybe<Scalars['String']['input']>;
  name_not_contains?: InputMaybe<Scalars['String']['input']>;
  name_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  name_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  name_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  name_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  name_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  name_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  name_starts_with?: InputMaybe<Scalars['String']['input']>;
  name_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  or?: InputMaybe<Array<InputMaybe<Module_Filter>>>;
  verified?: InputMaybe<Scalars['Boolean']['input']>;
  verified_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  verified_not?: InputMaybe<Scalars['Boolean']['input']>;
  verified_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  version?: InputMaybe<Scalars['String']['input']>;
  version_contains?: InputMaybe<Scalars['String']['input']>;
  version_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  version_ends_with?: InputMaybe<Scalars['String']['input']>;
  version_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  version_gt?: InputMaybe<Scalars['String']['input']>;
  version_gte?: InputMaybe<Scalars['String']['input']>;
  version_in?: InputMaybe<Array<Scalars['String']['input']>>;
  version_lt?: InputMaybe<Scalars['String']['input']>;
  version_lte?: InputMaybe<Scalars['String']['input']>;
  version_not?: InputMaybe<Scalars['String']['input']>;
  version_not_contains?: InputMaybe<Scalars['String']['input']>;
  version_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  version_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  version_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  version_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  version_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  version_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  version_starts_with?: InputMaybe<Scalars['String']['input']>;
  version_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export type Module_OrderBy =
  | 'factory'
  | 'factory__id'
  | 'factory__slotCount'
  | 'id'
  | 'name'
  | 'verified'
  | 'version';

export type NftCollection = {
  __typename?: 'NFTCollection';
  createdAt: Scalars['BigInt']['output'];
  createdTx: Scalars['Bytes']['output'];
  creator: Scalars['Bytes']['output'];
  currency: Currency;
  factory: Scalars['Bytes']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  symbol: Scalars['String']['output'];
  taxPercentage: Scalars['BigInt']['output'];
  tokens: Array<NftToken>;
  totalSupply: Scalars['BigInt']['output'];
};


export type NftCollectionTokensArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<NftToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<NftToken_Filter>;
};

export type NftCollection_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<NftCollection_Filter>>>;
  createdAt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  createdAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  createdTx?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_contains?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_gt?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_gte?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  createdTx_lt?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_lte?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_not?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  creator?: InputMaybe<Scalars['Bytes']['input']>;
  creator_contains?: InputMaybe<Scalars['Bytes']['input']>;
  creator_gt?: InputMaybe<Scalars['Bytes']['input']>;
  creator_gte?: InputMaybe<Scalars['Bytes']['input']>;
  creator_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  creator_lt?: InputMaybe<Scalars['Bytes']['input']>;
  creator_lte?: InputMaybe<Scalars['Bytes']['input']>;
  creator_not?: InputMaybe<Scalars['Bytes']['input']>;
  creator_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  creator_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  currency?: InputMaybe<Scalars['String']['input']>;
  currency_?: InputMaybe<Currency_Filter>;
  currency_contains?: InputMaybe<Scalars['String']['input']>;
  currency_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_gt?: InputMaybe<Scalars['String']['input']>;
  currency_gte?: InputMaybe<Scalars['String']['input']>;
  currency_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_lt?: InputMaybe<Scalars['String']['input']>;
  currency_lte?: InputMaybe<Scalars['String']['input']>;
  currency_not?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  factory?: InputMaybe<Scalars['Bytes']['input']>;
  factory_contains?: InputMaybe<Scalars['Bytes']['input']>;
  factory_gt?: InputMaybe<Scalars['Bytes']['input']>;
  factory_gte?: InputMaybe<Scalars['Bytes']['input']>;
  factory_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  factory_lt?: InputMaybe<Scalars['Bytes']['input']>;
  factory_lte?: InputMaybe<Scalars['Bytes']['input']>;
  factory_not?: InputMaybe<Scalars['Bytes']['input']>;
  factory_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  factory_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  name?: InputMaybe<Scalars['String']['input']>;
  name_contains?: InputMaybe<Scalars['String']['input']>;
  name_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  name_ends_with?: InputMaybe<Scalars['String']['input']>;
  name_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  name_gt?: InputMaybe<Scalars['String']['input']>;
  name_gte?: InputMaybe<Scalars['String']['input']>;
  name_in?: InputMaybe<Array<Scalars['String']['input']>>;
  name_lt?: InputMaybe<Scalars['String']['input']>;
  name_lte?: InputMaybe<Scalars['String']['input']>;
  name_not?: InputMaybe<Scalars['String']['input']>;
  name_not_contains?: InputMaybe<Scalars['String']['input']>;
  name_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  name_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  name_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  name_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  name_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  name_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  name_starts_with?: InputMaybe<Scalars['String']['input']>;
  name_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  or?: InputMaybe<Array<InputMaybe<NftCollection_Filter>>>;
  symbol?: InputMaybe<Scalars['String']['input']>;
  symbol_contains?: InputMaybe<Scalars['String']['input']>;
  symbol_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  symbol_ends_with?: InputMaybe<Scalars['String']['input']>;
  symbol_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  symbol_gt?: InputMaybe<Scalars['String']['input']>;
  symbol_gte?: InputMaybe<Scalars['String']['input']>;
  symbol_in?: InputMaybe<Array<Scalars['String']['input']>>;
  symbol_lt?: InputMaybe<Scalars['String']['input']>;
  symbol_lte?: InputMaybe<Scalars['String']['input']>;
  symbol_not?: InputMaybe<Scalars['String']['input']>;
  symbol_not_contains?: InputMaybe<Scalars['String']['input']>;
  symbol_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  symbol_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  symbol_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  symbol_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  symbol_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  symbol_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  symbol_starts_with?: InputMaybe<Scalars['String']['input']>;
  symbol_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  taxPercentage?: InputMaybe<Scalars['BigInt']['input']>;
  taxPercentage_gt?: InputMaybe<Scalars['BigInt']['input']>;
  taxPercentage_gte?: InputMaybe<Scalars['BigInt']['input']>;
  taxPercentage_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  taxPercentage_lt?: InputMaybe<Scalars['BigInt']['input']>;
  taxPercentage_lte?: InputMaybe<Scalars['BigInt']['input']>;
  taxPercentage_not?: InputMaybe<Scalars['BigInt']['input']>;
  taxPercentage_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tokens_?: InputMaybe<NftToken_Filter>;
  totalSupply?: InputMaybe<Scalars['BigInt']['input']>;
  totalSupply_gt?: InputMaybe<Scalars['BigInt']['input']>;
  totalSupply_gte?: InputMaybe<Scalars['BigInt']['input']>;
  totalSupply_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalSupply_lt?: InputMaybe<Scalars['BigInt']['input']>;
  totalSupply_lte?: InputMaybe<Scalars['BigInt']['input']>;
  totalSupply_not?: InputMaybe<Scalars['BigInt']['input']>;
  totalSupply_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
};

export type NftCollection_OrderBy =
  | 'createdAt'
  | 'createdTx'
  | 'creator'
  | 'currency'
  | 'currency__decimals'
  | 'currency__id'
  | 'currency__name'
  | 'currency__symbol'
  | 'factory'
  | 'id'
  | 'name'
  | 'symbol'
  | 'taxPercentage'
  | 'tokens'
  | 'totalSupply';

export type NftToken = {
  __typename?: 'NFTToken';
  collection: NftCollection;
  id: Scalars['ID']['output'];
  mintedAt: Scalars['BigInt']['output'];
  mintedTx: Scalars['Bytes']['output'];
  slot: Slot;
  tokenId: Scalars['BigInt']['output'];
  uri: Scalars['String']['output'];
};

export type NftToken_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<NftToken_Filter>>>;
  collection?: InputMaybe<Scalars['String']['input']>;
  collection_?: InputMaybe<NftCollection_Filter>;
  collection_contains?: InputMaybe<Scalars['String']['input']>;
  collection_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  collection_ends_with?: InputMaybe<Scalars['String']['input']>;
  collection_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collection_gt?: InputMaybe<Scalars['String']['input']>;
  collection_gte?: InputMaybe<Scalars['String']['input']>;
  collection_in?: InputMaybe<Array<Scalars['String']['input']>>;
  collection_lt?: InputMaybe<Scalars['String']['input']>;
  collection_lte?: InputMaybe<Scalars['String']['input']>;
  collection_not?: InputMaybe<Scalars['String']['input']>;
  collection_not_contains?: InputMaybe<Scalars['String']['input']>;
  collection_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  collection_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  collection_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collection_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  collection_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  collection_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  collection_starts_with?: InputMaybe<Scalars['String']['input']>;
  collection_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  mintedAt?: InputMaybe<Scalars['BigInt']['input']>;
  mintedAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  mintedAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  mintedAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  mintedAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  mintedAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  mintedAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  mintedAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  mintedTx?: InputMaybe<Scalars['Bytes']['input']>;
  mintedTx_contains?: InputMaybe<Scalars['Bytes']['input']>;
  mintedTx_gt?: InputMaybe<Scalars['Bytes']['input']>;
  mintedTx_gte?: InputMaybe<Scalars['Bytes']['input']>;
  mintedTx_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  mintedTx_lt?: InputMaybe<Scalars['Bytes']['input']>;
  mintedTx_lte?: InputMaybe<Scalars['Bytes']['input']>;
  mintedTx_not?: InputMaybe<Scalars['Bytes']['input']>;
  mintedTx_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  mintedTx_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  or?: InputMaybe<Array<InputMaybe<NftToken_Filter>>>;
  slot?: InputMaybe<Scalars['String']['input']>;
  slot_?: InputMaybe<Slot_Filter>;
  slot_contains?: InputMaybe<Scalars['String']['input']>;
  slot_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_gt?: InputMaybe<Scalars['String']['input']>;
  slot_gte?: InputMaybe<Scalars['String']['input']>;
  slot_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_lt?: InputMaybe<Scalars['String']['input']>;
  slot_lte?: InputMaybe<Scalars['String']['input']>;
  slot_not?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  tokenId?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_gt?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_gte?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tokenId_lt?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_lte?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_not?: InputMaybe<Scalars['BigInt']['input']>;
  tokenId_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  uri?: InputMaybe<Scalars['String']['input']>;
  uri_contains?: InputMaybe<Scalars['String']['input']>;
  uri_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  uri_ends_with?: InputMaybe<Scalars['String']['input']>;
  uri_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  uri_gt?: InputMaybe<Scalars['String']['input']>;
  uri_gte?: InputMaybe<Scalars['String']['input']>;
  uri_in?: InputMaybe<Array<Scalars['String']['input']>>;
  uri_lt?: InputMaybe<Scalars['String']['input']>;
  uri_lte?: InputMaybe<Scalars['String']['input']>;
  uri_not?: InputMaybe<Scalars['String']['input']>;
  uri_not_contains?: InputMaybe<Scalars['String']['input']>;
  uri_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  uri_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  uri_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  uri_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  uri_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  uri_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  uri_starts_with?: InputMaybe<Scalars['String']['input']>;
  uri_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
};

export type NftToken_OrderBy =
  | 'collection'
  | 'collection__createdAt'
  | 'collection__createdTx'
  | 'collection__creator'
  | 'collection__factory'
  | 'collection__id'
  | 'collection__name'
  | 'collection__symbol'
  | 'collection__taxPercentage'
  | 'collection__totalSupply'
  | 'id'
  | 'mintedAt'
  | 'mintedTx'
  | 'slot'
  | 'slot__collectedTax'
  | 'slot__createdAt'
  | 'slot__createdTx'
  | 'slot__deposit'
  | 'slot__id'
  | 'slot__liquidationBountyBps'
  | 'slot__manager'
  | 'slot__minDepositSeconds'
  | 'slot__mutableModule'
  | 'slot__mutableTax'
  | 'slot__occupant'
  | 'slot__price'
  | 'slot__recipient'
  | 'slot__taxPercentage'
  | 'slot__totalCollected'
  | 'slot__updatedAt'
  | 'tokenId'
  | 'uri';

/** Defines the order direction, either ascending or descending */
export type OrderDirection =
  | 'asc'
  | 'desc';

export type PendingUpdateCancelledEvent = {
  __typename?: 'PendingUpdateCancelledEvent';
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  slot: Slot;
  timestamp: Scalars['BigInt']['output'];
  tx: Scalars['Bytes']['output'];
};

export type PendingUpdateCancelledEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<PendingUpdateCancelledEvent_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<PendingUpdateCancelledEvent_Filter>>>;
  slot?: InputMaybe<Scalars['String']['input']>;
  slot_?: InputMaybe<Slot_Filter>;
  slot_contains?: InputMaybe<Scalars['String']['input']>;
  slot_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_gt?: InputMaybe<Scalars['String']['input']>;
  slot_gte?: InputMaybe<Scalars['String']['input']>;
  slot_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_lt?: InputMaybe<Scalars['String']['input']>;
  slot_lte?: InputMaybe<Scalars['String']['input']>;
  slot_not?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tx?: InputMaybe<Scalars['Bytes']['input']>;
  tx_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  tx_lt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_lte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export type PendingUpdateCancelledEvent_OrderBy =
  | 'blockNumber'
  | 'id'
  | 'slot'
  | 'slot__collectedTax'
  | 'slot__createdAt'
  | 'slot__createdTx'
  | 'slot__deposit'
  | 'slot__id'
  | 'slot__liquidationBountyBps'
  | 'slot__manager'
  | 'slot__minDepositSeconds'
  | 'slot__mutableModule'
  | 'slot__mutableTax'
  | 'slot__occupant'
  | 'slot__price'
  | 'slot__recipient'
  | 'slot__taxPercentage'
  | 'slot__totalCollected'
  | 'slot__updatedAt'
  | 'timestamp'
  | 'tx';

export type PriceUpdatedEvent = {
  __typename?: 'PriceUpdatedEvent';
  blockNumber: Scalars['BigInt']['output'];
  currency: Currency;
  id: Scalars['ID']['output'];
  newPrice: Scalars['BigInt']['output'];
  oldPrice: Scalars['BigInt']['output'];
  slot: Slot;
  timestamp: Scalars['BigInt']['output'];
  tx: Scalars['Bytes']['output'];
};

export type PriceUpdatedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<PriceUpdatedEvent_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  currency?: InputMaybe<Scalars['String']['input']>;
  currency_?: InputMaybe<Currency_Filter>;
  currency_contains?: InputMaybe<Scalars['String']['input']>;
  currency_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_gt?: InputMaybe<Scalars['String']['input']>;
  currency_gte?: InputMaybe<Scalars['String']['input']>;
  currency_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_lt?: InputMaybe<Scalars['String']['input']>;
  currency_lte?: InputMaybe<Scalars['String']['input']>;
  currency_not?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  newPrice?: InputMaybe<Scalars['BigInt']['input']>;
  newPrice_gt?: InputMaybe<Scalars['BigInt']['input']>;
  newPrice_gte?: InputMaybe<Scalars['BigInt']['input']>;
  newPrice_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  newPrice_lt?: InputMaybe<Scalars['BigInt']['input']>;
  newPrice_lte?: InputMaybe<Scalars['BigInt']['input']>;
  newPrice_not?: InputMaybe<Scalars['BigInt']['input']>;
  newPrice_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  oldPrice?: InputMaybe<Scalars['BigInt']['input']>;
  oldPrice_gt?: InputMaybe<Scalars['BigInt']['input']>;
  oldPrice_gte?: InputMaybe<Scalars['BigInt']['input']>;
  oldPrice_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  oldPrice_lt?: InputMaybe<Scalars['BigInt']['input']>;
  oldPrice_lte?: InputMaybe<Scalars['BigInt']['input']>;
  oldPrice_not?: InputMaybe<Scalars['BigInt']['input']>;
  oldPrice_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  or?: InputMaybe<Array<InputMaybe<PriceUpdatedEvent_Filter>>>;
  slot?: InputMaybe<Scalars['String']['input']>;
  slot_?: InputMaybe<Slot_Filter>;
  slot_contains?: InputMaybe<Scalars['String']['input']>;
  slot_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_gt?: InputMaybe<Scalars['String']['input']>;
  slot_gte?: InputMaybe<Scalars['String']['input']>;
  slot_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_lt?: InputMaybe<Scalars['String']['input']>;
  slot_lte?: InputMaybe<Scalars['String']['input']>;
  slot_not?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tx?: InputMaybe<Scalars['Bytes']['input']>;
  tx_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  tx_lt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_lte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export type PriceUpdatedEvent_OrderBy =
  | 'blockNumber'
  | 'currency'
  | 'currency__decimals'
  | 'currency__id'
  | 'currency__name'
  | 'currency__symbol'
  | 'id'
  | 'newPrice'
  | 'oldPrice'
  | 'slot'
  | 'slot__collectedTax'
  | 'slot__createdAt'
  | 'slot__createdTx'
  | 'slot__deposit'
  | 'slot__id'
  | 'slot__liquidationBountyBps'
  | 'slot__manager'
  | 'slot__minDepositSeconds'
  | 'slot__mutableModule'
  | 'slot__mutableTax'
  | 'slot__occupant'
  | 'slot__price'
  | 'slot__recipient'
  | 'slot__taxPercentage'
  | 'slot__totalCollected'
  | 'slot__updatedAt'
  | 'timestamp'
  | 'tx';

export type Query = {
  __typename?: 'Query';
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  account?: Maybe<Account>;
  accounts: Array<Account>;
  boughtEvent?: Maybe<BoughtEvent>;
  boughtEvents: Array<BoughtEvent>;
  currencies: Array<Currency>;
  currency?: Maybe<Currency>;
  depositedEvent?: Maybe<DepositedEvent>;
  depositedEvents: Array<DepositedEvent>;
  factories: Array<Factory>;
  factory?: Maybe<Factory>;
  liquidatedEvent?: Maybe<LiquidatedEvent>;
  liquidatedEvents: Array<LiquidatedEvent>;
  metadataSlot?: Maybe<MetadataSlot>;
  metadataSlots: Array<MetadataSlot>;
  metadataUpdatedEvent?: Maybe<MetadataUpdatedEvent>;
  metadataUpdatedEvents: Array<MetadataUpdatedEvent>;
  module?: Maybe<Module>;
  moduleUpdateProposedEvent?: Maybe<ModuleUpdateProposedEvent>;
  moduleUpdateProposedEvents: Array<ModuleUpdateProposedEvent>;
  modules: Array<Module>;
  nftcollection?: Maybe<NftCollection>;
  nftcollections: Array<NftCollection>;
  nfttoken?: Maybe<NftToken>;
  nfttokens: Array<NftToken>;
  pendingUpdateCancelledEvent?: Maybe<PendingUpdateCancelledEvent>;
  pendingUpdateCancelledEvents: Array<PendingUpdateCancelledEvent>;
  priceUpdatedEvent?: Maybe<PriceUpdatedEvent>;
  priceUpdatedEvents: Array<PriceUpdatedEvent>;
  releasedEvent?: Maybe<ReleasedEvent>;
  releasedEvents: Array<ReleasedEvent>;
  settledEvent?: Maybe<SettledEvent>;
  settledEvents: Array<SettledEvent>;
  slot?: Maybe<Slot>;
  slotDeployedEvent?: Maybe<SlotDeployedEvent>;
  slotDeployedEvents: Array<SlotDeployedEvent>;
  slots: Array<Slot>;
  taxCollectedEvent?: Maybe<TaxCollectedEvent>;
  taxCollectedEvents: Array<TaxCollectedEvent>;
  taxUpdateProposedEvent?: Maybe<TaxUpdateProposedEvent>;
  taxUpdateProposedEvents: Array<TaxUpdateProposedEvent>;
  withdrawnEvent?: Maybe<WithdrawnEvent>;
  withdrawnEvents: Array<WithdrawnEvent>;
};


export type Query_MetaArgs = {
  block?: InputMaybe<Block_Height>;
};


export type QueryAccountArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryAccountsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Account_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Account_Filter>;
};


export type QueryBoughtEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryBoughtEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BoughtEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<BoughtEvent_Filter>;
};


export type QueryCurrenciesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Currency_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Currency_Filter>;
};


export type QueryCurrencyArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryDepositedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryDepositedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<DepositedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<DepositedEvent_Filter>;
};


export type QueryFactoriesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Factory_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Factory_Filter>;
};


export type QueryFactoryArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryLiquidatedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryLiquidatedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LiquidatedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LiquidatedEvent_Filter>;
};


export type QueryMetadataSlotArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryMetadataSlotsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<MetadataSlot_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<MetadataSlot_Filter>;
};


export type QueryMetadataUpdatedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryMetadataUpdatedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<MetadataUpdatedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<MetadataUpdatedEvent_Filter>;
};


export type QueryModuleArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryModuleUpdateProposedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryModuleUpdateProposedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ModuleUpdateProposedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<ModuleUpdateProposedEvent_Filter>;
};


export type QueryModulesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Module_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Module_Filter>;
};


export type QueryNftcollectionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryNftcollectionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<NftCollection_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<NftCollection_Filter>;
};


export type QueryNfttokenArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryNfttokensArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<NftToken_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<NftToken_Filter>;
};


export type QueryPendingUpdateCancelledEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPendingUpdateCancelledEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<PendingUpdateCancelledEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PendingUpdateCancelledEvent_Filter>;
};


export type QueryPriceUpdatedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryPriceUpdatedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<PriceUpdatedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PriceUpdatedEvent_Filter>;
};


export type QueryReleasedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryReleasedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ReleasedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<ReleasedEvent_Filter>;
};


export type QuerySettledEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerySettledEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SettledEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<SettledEvent_Filter>;
};


export type QuerySlotArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerySlotDeployedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerySlotDeployedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SlotDeployedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<SlotDeployedEvent_Filter>;
};


export type QuerySlotsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Slot_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Slot_Filter>;
};


export type QueryTaxCollectedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTaxCollectedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TaxCollectedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TaxCollectedEvent_Filter>;
};


export type QueryTaxUpdateProposedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryTaxUpdateProposedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TaxUpdateProposedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TaxUpdateProposedEvent_Filter>;
};


export type QueryWithdrawnEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars['ID']['input'];
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryWithdrawnEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<WithdrawnEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<WithdrawnEvent_Filter>;
};

export type ReleasedEvent = {
  __typename?: 'ReleasedEvent';
  blockNumber: Scalars['BigInt']['output'];
  currency: Currency;
  id: Scalars['ID']['output'];
  occupant: Scalars['Bytes']['output'];
  refund: Scalars['BigInt']['output'];
  slot: Slot;
  timestamp: Scalars['BigInt']['output'];
  tx: Scalars['Bytes']['output'];
};

export type ReleasedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<ReleasedEvent_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  currency?: InputMaybe<Scalars['String']['input']>;
  currency_?: InputMaybe<Currency_Filter>;
  currency_contains?: InputMaybe<Scalars['String']['input']>;
  currency_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_gt?: InputMaybe<Scalars['String']['input']>;
  currency_gte?: InputMaybe<Scalars['String']['input']>;
  currency_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_lt?: InputMaybe<Scalars['String']['input']>;
  currency_lte?: InputMaybe<Scalars['String']['input']>;
  currency_not?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  occupant?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_contains?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_gt?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_gte?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  occupant_lt?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_lte?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_not?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  or?: InputMaybe<Array<InputMaybe<ReleasedEvent_Filter>>>;
  refund?: InputMaybe<Scalars['BigInt']['input']>;
  refund_gt?: InputMaybe<Scalars['BigInt']['input']>;
  refund_gte?: InputMaybe<Scalars['BigInt']['input']>;
  refund_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  refund_lt?: InputMaybe<Scalars['BigInt']['input']>;
  refund_lte?: InputMaybe<Scalars['BigInt']['input']>;
  refund_not?: InputMaybe<Scalars['BigInt']['input']>;
  refund_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  slot?: InputMaybe<Scalars['String']['input']>;
  slot_?: InputMaybe<Slot_Filter>;
  slot_contains?: InputMaybe<Scalars['String']['input']>;
  slot_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_gt?: InputMaybe<Scalars['String']['input']>;
  slot_gte?: InputMaybe<Scalars['String']['input']>;
  slot_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_lt?: InputMaybe<Scalars['String']['input']>;
  slot_lte?: InputMaybe<Scalars['String']['input']>;
  slot_not?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tx?: InputMaybe<Scalars['Bytes']['input']>;
  tx_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  tx_lt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_lte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export type ReleasedEvent_OrderBy =
  | 'blockNumber'
  | 'currency'
  | 'currency__decimals'
  | 'currency__id'
  | 'currency__name'
  | 'currency__symbol'
  | 'id'
  | 'occupant'
  | 'refund'
  | 'slot'
  | 'slot__collectedTax'
  | 'slot__createdAt'
  | 'slot__createdTx'
  | 'slot__deposit'
  | 'slot__id'
  | 'slot__liquidationBountyBps'
  | 'slot__manager'
  | 'slot__minDepositSeconds'
  | 'slot__mutableModule'
  | 'slot__mutableTax'
  | 'slot__occupant'
  | 'slot__price'
  | 'slot__recipient'
  | 'slot__taxPercentage'
  | 'slot__totalCollected'
  | 'slot__updatedAt'
  | 'timestamp'
  | 'tx';

export type SettledEvent = {
  __typename?: 'SettledEvent';
  blockNumber: Scalars['BigInt']['output'];
  currency: Currency;
  depositRemaining: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  slot: Slot;
  taxOwed: Scalars['BigInt']['output'];
  taxPaid: Scalars['BigInt']['output'];
  timestamp: Scalars['BigInt']['output'];
  tx: Scalars['Bytes']['output'];
};

export type SettledEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<SettledEvent_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  currency?: InputMaybe<Scalars['String']['input']>;
  currency_?: InputMaybe<Currency_Filter>;
  currency_contains?: InputMaybe<Scalars['String']['input']>;
  currency_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_gt?: InputMaybe<Scalars['String']['input']>;
  currency_gte?: InputMaybe<Scalars['String']['input']>;
  currency_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_lt?: InputMaybe<Scalars['String']['input']>;
  currency_lte?: InputMaybe<Scalars['String']['input']>;
  currency_not?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  depositRemaining?: InputMaybe<Scalars['BigInt']['input']>;
  depositRemaining_gt?: InputMaybe<Scalars['BigInt']['input']>;
  depositRemaining_gte?: InputMaybe<Scalars['BigInt']['input']>;
  depositRemaining_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  depositRemaining_lt?: InputMaybe<Scalars['BigInt']['input']>;
  depositRemaining_lte?: InputMaybe<Scalars['BigInt']['input']>;
  depositRemaining_not?: InputMaybe<Scalars['BigInt']['input']>;
  depositRemaining_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<SettledEvent_Filter>>>;
  slot?: InputMaybe<Scalars['String']['input']>;
  slot_?: InputMaybe<Slot_Filter>;
  slot_contains?: InputMaybe<Scalars['String']['input']>;
  slot_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_gt?: InputMaybe<Scalars['String']['input']>;
  slot_gte?: InputMaybe<Scalars['String']['input']>;
  slot_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_lt?: InputMaybe<Scalars['String']['input']>;
  slot_lte?: InputMaybe<Scalars['String']['input']>;
  slot_not?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  taxOwed?: InputMaybe<Scalars['BigInt']['input']>;
  taxOwed_gt?: InputMaybe<Scalars['BigInt']['input']>;
  taxOwed_gte?: InputMaybe<Scalars['BigInt']['input']>;
  taxOwed_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  taxOwed_lt?: InputMaybe<Scalars['BigInt']['input']>;
  taxOwed_lte?: InputMaybe<Scalars['BigInt']['input']>;
  taxOwed_not?: InputMaybe<Scalars['BigInt']['input']>;
  taxOwed_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  taxPaid?: InputMaybe<Scalars['BigInt']['input']>;
  taxPaid_gt?: InputMaybe<Scalars['BigInt']['input']>;
  taxPaid_gte?: InputMaybe<Scalars['BigInt']['input']>;
  taxPaid_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  taxPaid_lt?: InputMaybe<Scalars['BigInt']['input']>;
  taxPaid_lte?: InputMaybe<Scalars['BigInt']['input']>;
  taxPaid_not?: InputMaybe<Scalars['BigInt']['input']>;
  taxPaid_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tx?: InputMaybe<Scalars['Bytes']['input']>;
  tx_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  tx_lt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_lte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export type SettledEvent_OrderBy =
  | 'blockNumber'
  | 'currency'
  | 'currency__decimals'
  | 'currency__id'
  | 'currency__name'
  | 'currency__symbol'
  | 'depositRemaining'
  | 'id'
  | 'slot'
  | 'slot__collectedTax'
  | 'slot__createdAt'
  | 'slot__createdTx'
  | 'slot__deposit'
  | 'slot__id'
  | 'slot__liquidationBountyBps'
  | 'slot__manager'
  | 'slot__minDepositSeconds'
  | 'slot__mutableModule'
  | 'slot__mutableTax'
  | 'slot__occupant'
  | 'slot__price'
  | 'slot__recipient'
  | 'slot__taxPercentage'
  | 'slot__totalCollected'
  | 'slot__updatedAt'
  | 'taxOwed'
  | 'taxPaid'
  | 'timestamp'
  | 'tx';

export type Slot = {
  __typename?: 'Slot';
  collectedTax: Scalars['BigInt']['output'];
  createdAt: Scalars['BigInt']['output'];
  createdTx: Scalars['Bytes']['output'];
  currency: Currency;
  deployEvent?: Maybe<SlotDeployedEvent>;
  deposit: Scalars['BigInt']['output'];
  deposits: Array<DepositedEvent>;
  id: Scalars['ID']['output'];
  liquidationBountyBps: Scalars['BigInt']['output'];
  liquidations: Array<LiquidatedEvent>;
  manager: Scalars['Bytes']['output'];
  metadata?: Maybe<MetadataSlot>;
  metadataUpdates: Array<MetadataUpdatedEvent>;
  minDepositSeconds: Scalars['BigInt']['output'];
  module?: Maybe<Module>;
  moduleUpdateProposals: Array<ModuleUpdateProposedEvent>;
  mutableModule: Scalars['Boolean']['output'];
  mutableTax: Scalars['Boolean']['output'];
  occupant?: Maybe<Scalars['Bytes']['output']>;
  occupantAccount?: Maybe<Account>;
  pendingUpdateCancellations: Array<PendingUpdateCancelledEvent>;
  price: Scalars['BigInt']['output'];
  priceUpdates: Array<PriceUpdatedEvent>;
  purchases: Array<BoughtEvent>;
  recipient: Scalars['Bytes']['output'];
  recipientAccount: Account;
  releases: Array<ReleasedEvent>;
  settlements: Array<SettledEvent>;
  taxCollections: Array<TaxCollectedEvent>;
  taxPercentage: Scalars['BigInt']['output'];
  taxUpdateProposals: Array<TaxUpdateProposedEvent>;
  totalCollected: Scalars['BigInt']['output'];
  updatedAt: Scalars['BigInt']['output'];
  withdrawals: Array<WithdrawnEvent>;
};


export type SlotDepositsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<DepositedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<DepositedEvent_Filter>;
};


export type SlotLiquidationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LiquidatedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<LiquidatedEvent_Filter>;
};


export type SlotMetadataUpdatesArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<MetadataUpdatedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<MetadataUpdatedEvent_Filter>;
};


export type SlotModuleUpdateProposalsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ModuleUpdateProposedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<ModuleUpdateProposedEvent_Filter>;
};


export type SlotPendingUpdateCancellationsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<PendingUpdateCancelledEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<PendingUpdateCancelledEvent_Filter>;
};


export type SlotPriceUpdatesArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<PriceUpdatedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<PriceUpdatedEvent_Filter>;
};


export type SlotPurchasesArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BoughtEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<BoughtEvent_Filter>;
};


export type SlotReleasesArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ReleasedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<ReleasedEvent_Filter>;
};


export type SlotSettlementsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SettledEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<SettledEvent_Filter>;
};


export type SlotTaxCollectionsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TaxCollectedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<TaxCollectedEvent_Filter>;
};


export type SlotTaxUpdateProposalsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TaxUpdateProposedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<TaxUpdateProposedEvent_Filter>;
};


export type SlotWithdrawalsArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<WithdrawnEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<WithdrawnEvent_Filter>;
};

export type SlotDeployedEvent = {
  __typename?: 'SlotDeployedEvent';
  blockNumber: Scalars['BigInt']['output'];
  currency: Currency;
  deployer: Scalars['Bytes']['output'];
  id: Scalars['ID']['output'];
  liquidationBountyBps: Scalars['BigInt']['output'];
  manager: Scalars['Bytes']['output'];
  minDepositSeconds: Scalars['BigInt']['output'];
  module: Scalars['Bytes']['output'];
  mutableModule: Scalars['Boolean']['output'];
  mutableTax: Scalars['Boolean']['output'];
  recipient: Scalars['Bytes']['output'];
  slot: Slot;
  taxPercentage: Scalars['BigInt']['output'];
  timestamp: Scalars['BigInt']['output'];
  tx: Scalars['Bytes']['output'];
};

export type SlotDeployedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<SlotDeployedEvent_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  currency?: InputMaybe<Scalars['String']['input']>;
  currency_?: InputMaybe<Currency_Filter>;
  currency_contains?: InputMaybe<Scalars['String']['input']>;
  currency_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_gt?: InputMaybe<Scalars['String']['input']>;
  currency_gte?: InputMaybe<Scalars['String']['input']>;
  currency_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_lt?: InputMaybe<Scalars['String']['input']>;
  currency_lte?: InputMaybe<Scalars['String']['input']>;
  currency_not?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  deployer?: InputMaybe<Scalars['Bytes']['input']>;
  deployer_contains?: InputMaybe<Scalars['Bytes']['input']>;
  deployer_gt?: InputMaybe<Scalars['Bytes']['input']>;
  deployer_gte?: InputMaybe<Scalars['Bytes']['input']>;
  deployer_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  deployer_lt?: InputMaybe<Scalars['Bytes']['input']>;
  deployer_lte?: InputMaybe<Scalars['Bytes']['input']>;
  deployer_not?: InputMaybe<Scalars['Bytes']['input']>;
  deployer_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  deployer_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  liquidationBountyBps?: InputMaybe<Scalars['BigInt']['input']>;
  liquidationBountyBps_gt?: InputMaybe<Scalars['BigInt']['input']>;
  liquidationBountyBps_gte?: InputMaybe<Scalars['BigInt']['input']>;
  liquidationBountyBps_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  liquidationBountyBps_lt?: InputMaybe<Scalars['BigInt']['input']>;
  liquidationBountyBps_lte?: InputMaybe<Scalars['BigInt']['input']>;
  liquidationBountyBps_not?: InputMaybe<Scalars['BigInt']['input']>;
  liquidationBountyBps_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  manager?: InputMaybe<Scalars['Bytes']['input']>;
  manager_contains?: InputMaybe<Scalars['Bytes']['input']>;
  manager_gt?: InputMaybe<Scalars['Bytes']['input']>;
  manager_gte?: InputMaybe<Scalars['Bytes']['input']>;
  manager_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  manager_lt?: InputMaybe<Scalars['Bytes']['input']>;
  manager_lte?: InputMaybe<Scalars['Bytes']['input']>;
  manager_not?: InputMaybe<Scalars['Bytes']['input']>;
  manager_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  manager_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  minDepositSeconds?: InputMaybe<Scalars['BigInt']['input']>;
  minDepositSeconds_gt?: InputMaybe<Scalars['BigInt']['input']>;
  minDepositSeconds_gte?: InputMaybe<Scalars['BigInt']['input']>;
  minDepositSeconds_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  minDepositSeconds_lt?: InputMaybe<Scalars['BigInt']['input']>;
  minDepositSeconds_lte?: InputMaybe<Scalars['BigInt']['input']>;
  minDepositSeconds_not?: InputMaybe<Scalars['BigInt']['input']>;
  minDepositSeconds_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  module?: InputMaybe<Scalars['Bytes']['input']>;
  module_contains?: InputMaybe<Scalars['Bytes']['input']>;
  module_gt?: InputMaybe<Scalars['Bytes']['input']>;
  module_gte?: InputMaybe<Scalars['Bytes']['input']>;
  module_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  module_lt?: InputMaybe<Scalars['Bytes']['input']>;
  module_lte?: InputMaybe<Scalars['Bytes']['input']>;
  module_not?: InputMaybe<Scalars['Bytes']['input']>;
  module_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  module_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  mutableModule?: InputMaybe<Scalars['Boolean']['input']>;
  mutableModule_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  mutableModule_not?: InputMaybe<Scalars['Boolean']['input']>;
  mutableModule_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  mutableTax?: InputMaybe<Scalars['Boolean']['input']>;
  mutableTax_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  mutableTax_not?: InputMaybe<Scalars['Boolean']['input']>;
  mutableTax_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  or?: InputMaybe<Array<InputMaybe<SlotDeployedEvent_Filter>>>;
  recipient?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_contains?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_gt?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_gte?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  recipient_lt?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_lte?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_not?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  slot?: InputMaybe<Scalars['String']['input']>;
  slot_?: InputMaybe<Slot_Filter>;
  slot_contains?: InputMaybe<Scalars['String']['input']>;
  slot_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_gt?: InputMaybe<Scalars['String']['input']>;
  slot_gte?: InputMaybe<Scalars['String']['input']>;
  slot_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_lt?: InputMaybe<Scalars['String']['input']>;
  slot_lte?: InputMaybe<Scalars['String']['input']>;
  slot_not?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  taxPercentage?: InputMaybe<Scalars['BigInt']['input']>;
  taxPercentage_gt?: InputMaybe<Scalars['BigInt']['input']>;
  taxPercentage_gte?: InputMaybe<Scalars['BigInt']['input']>;
  taxPercentage_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  taxPercentage_lt?: InputMaybe<Scalars['BigInt']['input']>;
  taxPercentage_lte?: InputMaybe<Scalars['BigInt']['input']>;
  taxPercentage_not?: InputMaybe<Scalars['BigInt']['input']>;
  taxPercentage_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tx?: InputMaybe<Scalars['Bytes']['input']>;
  tx_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  tx_lt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_lte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export type SlotDeployedEvent_OrderBy =
  | 'blockNumber'
  | 'currency'
  | 'currency__decimals'
  | 'currency__id'
  | 'currency__name'
  | 'currency__symbol'
  | 'deployer'
  | 'id'
  | 'liquidationBountyBps'
  | 'manager'
  | 'minDepositSeconds'
  | 'module'
  | 'mutableModule'
  | 'mutableTax'
  | 'recipient'
  | 'slot'
  | 'slot__collectedTax'
  | 'slot__createdAt'
  | 'slot__createdTx'
  | 'slot__deposit'
  | 'slot__id'
  | 'slot__liquidationBountyBps'
  | 'slot__manager'
  | 'slot__minDepositSeconds'
  | 'slot__mutableModule'
  | 'slot__mutableTax'
  | 'slot__occupant'
  | 'slot__price'
  | 'slot__recipient'
  | 'slot__taxPercentage'
  | 'slot__totalCollected'
  | 'slot__updatedAt'
  | 'taxPercentage'
  | 'timestamp'
  | 'tx';

export type Slot_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Slot_Filter>>>;
  collectedTax?: InputMaybe<Scalars['BigInt']['input']>;
  collectedTax_gt?: InputMaybe<Scalars['BigInt']['input']>;
  collectedTax_gte?: InputMaybe<Scalars['BigInt']['input']>;
  collectedTax_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  collectedTax_lt?: InputMaybe<Scalars['BigInt']['input']>;
  collectedTax_lte?: InputMaybe<Scalars['BigInt']['input']>;
  collectedTax_not?: InputMaybe<Scalars['BigInt']['input']>;
  collectedTax_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  createdAt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  createdAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  createdAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  createdTx?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_contains?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_gt?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_gte?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  createdTx_lt?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_lte?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_not?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  createdTx_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  currency?: InputMaybe<Scalars['String']['input']>;
  currency_?: InputMaybe<Currency_Filter>;
  currency_contains?: InputMaybe<Scalars['String']['input']>;
  currency_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_gt?: InputMaybe<Scalars['String']['input']>;
  currency_gte?: InputMaybe<Scalars['String']['input']>;
  currency_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_lt?: InputMaybe<Scalars['String']['input']>;
  currency_lte?: InputMaybe<Scalars['String']['input']>;
  currency_not?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  deployEvent_?: InputMaybe<SlotDeployedEvent_Filter>;
  deposit?: InputMaybe<Scalars['BigInt']['input']>;
  deposit_gt?: InputMaybe<Scalars['BigInt']['input']>;
  deposit_gte?: InputMaybe<Scalars['BigInt']['input']>;
  deposit_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  deposit_lt?: InputMaybe<Scalars['BigInt']['input']>;
  deposit_lte?: InputMaybe<Scalars['BigInt']['input']>;
  deposit_not?: InputMaybe<Scalars['BigInt']['input']>;
  deposit_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  deposits_?: InputMaybe<DepositedEvent_Filter>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  liquidationBountyBps?: InputMaybe<Scalars['BigInt']['input']>;
  liquidationBountyBps_gt?: InputMaybe<Scalars['BigInt']['input']>;
  liquidationBountyBps_gte?: InputMaybe<Scalars['BigInt']['input']>;
  liquidationBountyBps_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  liquidationBountyBps_lt?: InputMaybe<Scalars['BigInt']['input']>;
  liquidationBountyBps_lte?: InputMaybe<Scalars['BigInt']['input']>;
  liquidationBountyBps_not?: InputMaybe<Scalars['BigInt']['input']>;
  liquidationBountyBps_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  liquidations_?: InputMaybe<LiquidatedEvent_Filter>;
  manager?: InputMaybe<Scalars['Bytes']['input']>;
  manager_contains?: InputMaybe<Scalars['Bytes']['input']>;
  manager_gt?: InputMaybe<Scalars['Bytes']['input']>;
  manager_gte?: InputMaybe<Scalars['Bytes']['input']>;
  manager_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  manager_lt?: InputMaybe<Scalars['Bytes']['input']>;
  manager_lte?: InputMaybe<Scalars['Bytes']['input']>;
  manager_not?: InputMaybe<Scalars['Bytes']['input']>;
  manager_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  manager_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  metadataUpdates_?: InputMaybe<MetadataUpdatedEvent_Filter>;
  metadata_?: InputMaybe<MetadataSlot_Filter>;
  minDepositSeconds?: InputMaybe<Scalars['BigInt']['input']>;
  minDepositSeconds_gt?: InputMaybe<Scalars['BigInt']['input']>;
  minDepositSeconds_gte?: InputMaybe<Scalars['BigInt']['input']>;
  minDepositSeconds_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  minDepositSeconds_lt?: InputMaybe<Scalars['BigInt']['input']>;
  minDepositSeconds_lte?: InputMaybe<Scalars['BigInt']['input']>;
  minDepositSeconds_not?: InputMaybe<Scalars['BigInt']['input']>;
  minDepositSeconds_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  module?: InputMaybe<Scalars['String']['input']>;
  moduleUpdateProposals_?: InputMaybe<ModuleUpdateProposedEvent_Filter>;
  module_?: InputMaybe<Module_Filter>;
  module_contains?: InputMaybe<Scalars['String']['input']>;
  module_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  module_ends_with?: InputMaybe<Scalars['String']['input']>;
  module_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  module_gt?: InputMaybe<Scalars['String']['input']>;
  module_gte?: InputMaybe<Scalars['String']['input']>;
  module_in?: InputMaybe<Array<Scalars['String']['input']>>;
  module_lt?: InputMaybe<Scalars['String']['input']>;
  module_lte?: InputMaybe<Scalars['String']['input']>;
  module_not?: InputMaybe<Scalars['String']['input']>;
  module_not_contains?: InputMaybe<Scalars['String']['input']>;
  module_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  module_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  module_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  module_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  module_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  module_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  module_starts_with?: InputMaybe<Scalars['String']['input']>;
  module_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  mutableModule?: InputMaybe<Scalars['Boolean']['input']>;
  mutableModule_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  mutableModule_not?: InputMaybe<Scalars['Boolean']['input']>;
  mutableModule_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  mutableTax?: InputMaybe<Scalars['Boolean']['input']>;
  mutableTax_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  mutableTax_not?: InputMaybe<Scalars['Boolean']['input']>;
  mutableTax_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  occupant?: InputMaybe<Scalars['Bytes']['input']>;
  occupantAccount?: InputMaybe<Scalars['String']['input']>;
  occupantAccount_?: InputMaybe<Account_Filter>;
  occupantAccount_contains?: InputMaybe<Scalars['String']['input']>;
  occupantAccount_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  occupantAccount_ends_with?: InputMaybe<Scalars['String']['input']>;
  occupantAccount_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  occupantAccount_gt?: InputMaybe<Scalars['String']['input']>;
  occupantAccount_gte?: InputMaybe<Scalars['String']['input']>;
  occupantAccount_in?: InputMaybe<Array<Scalars['String']['input']>>;
  occupantAccount_lt?: InputMaybe<Scalars['String']['input']>;
  occupantAccount_lte?: InputMaybe<Scalars['String']['input']>;
  occupantAccount_not?: InputMaybe<Scalars['String']['input']>;
  occupantAccount_not_contains?: InputMaybe<Scalars['String']['input']>;
  occupantAccount_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  occupantAccount_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  occupantAccount_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  occupantAccount_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  occupantAccount_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  occupantAccount_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  occupantAccount_starts_with?: InputMaybe<Scalars['String']['input']>;
  occupantAccount_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  occupant_contains?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_gt?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_gte?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  occupant_lt?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_lte?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_not?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  or?: InputMaybe<Array<InputMaybe<Slot_Filter>>>;
  pendingUpdateCancellations_?: InputMaybe<PendingUpdateCancelledEvent_Filter>;
  price?: InputMaybe<Scalars['BigInt']['input']>;
  priceUpdates_?: InputMaybe<PriceUpdatedEvent_Filter>;
  price_gt?: InputMaybe<Scalars['BigInt']['input']>;
  price_gte?: InputMaybe<Scalars['BigInt']['input']>;
  price_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  price_lt?: InputMaybe<Scalars['BigInt']['input']>;
  price_lte?: InputMaybe<Scalars['BigInt']['input']>;
  price_not?: InputMaybe<Scalars['BigInt']['input']>;
  price_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  purchases_?: InputMaybe<BoughtEvent_Filter>;
  recipient?: InputMaybe<Scalars['Bytes']['input']>;
  recipientAccount?: InputMaybe<Scalars['String']['input']>;
  recipientAccount_?: InputMaybe<Account_Filter>;
  recipientAccount_contains?: InputMaybe<Scalars['String']['input']>;
  recipientAccount_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  recipientAccount_ends_with?: InputMaybe<Scalars['String']['input']>;
  recipientAccount_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  recipientAccount_gt?: InputMaybe<Scalars['String']['input']>;
  recipientAccount_gte?: InputMaybe<Scalars['String']['input']>;
  recipientAccount_in?: InputMaybe<Array<Scalars['String']['input']>>;
  recipientAccount_lt?: InputMaybe<Scalars['String']['input']>;
  recipientAccount_lte?: InputMaybe<Scalars['String']['input']>;
  recipientAccount_not?: InputMaybe<Scalars['String']['input']>;
  recipientAccount_not_contains?: InputMaybe<Scalars['String']['input']>;
  recipientAccount_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  recipientAccount_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  recipientAccount_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  recipientAccount_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  recipientAccount_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  recipientAccount_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  recipientAccount_starts_with?: InputMaybe<Scalars['String']['input']>;
  recipientAccount_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  recipient_contains?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_gt?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_gte?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  recipient_lt?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_lte?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_not?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  releases_?: InputMaybe<ReleasedEvent_Filter>;
  settlements_?: InputMaybe<SettledEvent_Filter>;
  taxCollections_?: InputMaybe<TaxCollectedEvent_Filter>;
  taxPercentage?: InputMaybe<Scalars['BigInt']['input']>;
  taxPercentage_gt?: InputMaybe<Scalars['BigInt']['input']>;
  taxPercentage_gte?: InputMaybe<Scalars['BigInt']['input']>;
  taxPercentage_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  taxPercentage_lt?: InputMaybe<Scalars['BigInt']['input']>;
  taxPercentage_lte?: InputMaybe<Scalars['BigInt']['input']>;
  taxPercentage_not?: InputMaybe<Scalars['BigInt']['input']>;
  taxPercentage_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  taxUpdateProposals_?: InputMaybe<TaxUpdateProposedEvent_Filter>;
  totalCollected?: InputMaybe<Scalars['BigInt']['input']>;
  totalCollected_gt?: InputMaybe<Scalars['BigInt']['input']>;
  totalCollected_gte?: InputMaybe<Scalars['BigInt']['input']>;
  totalCollected_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalCollected_lt?: InputMaybe<Scalars['BigInt']['input']>;
  totalCollected_lte?: InputMaybe<Scalars['BigInt']['input']>;
  totalCollected_not?: InputMaybe<Scalars['BigInt']['input']>;
  totalCollected_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  updatedAt?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_gt?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_gte?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  updatedAt_lt?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_lte?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_not?: InputMaybe<Scalars['BigInt']['input']>;
  updatedAt_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  withdrawals_?: InputMaybe<WithdrawnEvent_Filter>;
};

export type Slot_OrderBy =
  | 'collectedTax'
  | 'createdAt'
  | 'createdTx'
  | 'currency'
  | 'currency__decimals'
  | 'currency__id'
  | 'currency__name'
  | 'currency__symbol'
  | 'deployEvent'
  | 'deployEvent__blockNumber'
  | 'deployEvent__deployer'
  | 'deployEvent__id'
  | 'deployEvent__liquidationBountyBps'
  | 'deployEvent__manager'
  | 'deployEvent__minDepositSeconds'
  | 'deployEvent__module'
  | 'deployEvent__mutableModule'
  | 'deployEvent__mutableTax'
  | 'deployEvent__recipient'
  | 'deployEvent__taxPercentage'
  | 'deployEvent__timestamp'
  | 'deployEvent__tx'
  | 'deposit'
  | 'deposits'
  | 'id'
  | 'liquidationBountyBps'
  | 'liquidations'
  | 'manager'
  | 'metadata'
  | 'metadataUpdates'
  | 'metadata__adType'
  | 'metadata__createdAt'
  | 'metadata__createdTx'
  | 'metadata__id'
  | 'metadata__rawJson'
  | 'metadata__updateCount'
  | 'metadata__updatedAt'
  | 'metadata__updatedBy'
  | 'metadata__updatedTx'
  | 'metadata__uri'
  | 'minDepositSeconds'
  | 'module'
  | 'moduleUpdateProposals'
  | 'module__id'
  | 'module__name'
  | 'module__verified'
  | 'module__version'
  | 'mutableModule'
  | 'mutableTax'
  | 'occupant'
  | 'occupantAccount'
  | 'occupantAccount__id'
  | 'occupantAccount__occupiedCount'
  | 'occupantAccount__slotCount'
  | 'occupantAccount__type'
  | 'pendingUpdateCancellations'
  | 'price'
  | 'priceUpdates'
  | 'purchases'
  | 'recipient'
  | 'recipientAccount'
  | 'recipientAccount__id'
  | 'recipientAccount__occupiedCount'
  | 'recipientAccount__slotCount'
  | 'recipientAccount__type'
  | 'releases'
  | 'settlements'
  | 'taxCollections'
  | 'taxPercentage'
  | 'taxUpdateProposals'
  | 'totalCollected'
  | 'updatedAt'
  | 'withdrawals';

export type TaxCollectedEvent = {
  __typename?: 'TaxCollectedEvent';
  amount: Scalars['BigInt']['output'];
  blockNumber: Scalars['BigInt']['output'];
  currency: Currency;
  id: Scalars['ID']['output'];
  recipient: Scalars['Bytes']['output'];
  slot: Slot;
  timestamp: Scalars['BigInt']['output'];
  tx: Scalars['Bytes']['output'];
};

export type TaxCollectedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<TaxCollectedEvent_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  currency?: InputMaybe<Scalars['String']['input']>;
  currency_?: InputMaybe<Currency_Filter>;
  currency_contains?: InputMaybe<Scalars['String']['input']>;
  currency_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_gt?: InputMaybe<Scalars['String']['input']>;
  currency_gte?: InputMaybe<Scalars['String']['input']>;
  currency_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_lt?: InputMaybe<Scalars['String']['input']>;
  currency_lte?: InputMaybe<Scalars['String']['input']>;
  currency_not?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  or?: InputMaybe<Array<InputMaybe<TaxCollectedEvent_Filter>>>;
  recipient?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_contains?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_gt?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_gte?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  recipient_lt?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_lte?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_not?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  recipient_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  slot?: InputMaybe<Scalars['String']['input']>;
  slot_?: InputMaybe<Slot_Filter>;
  slot_contains?: InputMaybe<Scalars['String']['input']>;
  slot_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_gt?: InputMaybe<Scalars['String']['input']>;
  slot_gte?: InputMaybe<Scalars['String']['input']>;
  slot_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_lt?: InputMaybe<Scalars['String']['input']>;
  slot_lte?: InputMaybe<Scalars['String']['input']>;
  slot_not?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tx?: InputMaybe<Scalars['Bytes']['input']>;
  tx_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  tx_lt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_lte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export type TaxCollectedEvent_OrderBy =
  | 'amount'
  | 'blockNumber'
  | 'currency'
  | 'currency__decimals'
  | 'currency__id'
  | 'currency__name'
  | 'currency__symbol'
  | 'id'
  | 'recipient'
  | 'slot'
  | 'slot__collectedTax'
  | 'slot__createdAt'
  | 'slot__createdTx'
  | 'slot__deposit'
  | 'slot__id'
  | 'slot__liquidationBountyBps'
  | 'slot__manager'
  | 'slot__minDepositSeconds'
  | 'slot__mutableModule'
  | 'slot__mutableTax'
  | 'slot__occupant'
  | 'slot__price'
  | 'slot__recipient'
  | 'slot__taxPercentage'
  | 'slot__totalCollected'
  | 'slot__updatedAt'
  | 'timestamp'
  | 'tx';

export type TaxUpdateProposedEvent = {
  __typename?: 'TaxUpdateProposedEvent';
  blockNumber: Scalars['BigInt']['output'];
  id: Scalars['ID']['output'];
  newPercentage: Scalars['BigInt']['output'];
  slot: Slot;
  timestamp: Scalars['BigInt']['output'];
  tx: Scalars['Bytes']['output'];
};

export type TaxUpdateProposedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<TaxUpdateProposedEvent_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  newPercentage?: InputMaybe<Scalars['BigInt']['input']>;
  newPercentage_gt?: InputMaybe<Scalars['BigInt']['input']>;
  newPercentage_gte?: InputMaybe<Scalars['BigInt']['input']>;
  newPercentage_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  newPercentage_lt?: InputMaybe<Scalars['BigInt']['input']>;
  newPercentage_lte?: InputMaybe<Scalars['BigInt']['input']>;
  newPercentage_not?: InputMaybe<Scalars['BigInt']['input']>;
  newPercentage_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  or?: InputMaybe<Array<InputMaybe<TaxUpdateProposedEvent_Filter>>>;
  slot?: InputMaybe<Scalars['String']['input']>;
  slot_?: InputMaybe<Slot_Filter>;
  slot_contains?: InputMaybe<Scalars['String']['input']>;
  slot_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_gt?: InputMaybe<Scalars['String']['input']>;
  slot_gte?: InputMaybe<Scalars['String']['input']>;
  slot_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_lt?: InputMaybe<Scalars['String']['input']>;
  slot_lte?: InputMaybe<Scalars['String']['input']>;
  slot_not?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tx?: InputMaybe<Scalars['Bytes']['input']>;
  tx_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  tx_lt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_lte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export type TaxUpdateProposedEvent_OrderBy =
  | 'blockNumber'
  | 'id'
  | 'newPercentage'
  | 'slot'
  | 'slot__collectedTax'
  | 'slot__createdAt'
  | 'slot__createdTx'
  | 'slot__deposit'
  | 'slot__id'
  | 'slot__liquidationBountyBps'
  | 'slot__manager'
  | 'slot__minDepositSeconds'
  | 'slot__mutableModule'
  | 'slot__mutableTax'
  | 'slot__occupant'
  | 'slot__price'
  | 'slot__recipient'
  | 'slot__taxPercentage'
  | 'slot__totalCollected'
  | 'slot__updatedAt'
  | 'timestamp'
  | 'tx';

export type WithdrawnEvent = {
  __typename?: 'WithdrawnEvent';
  amount: Scalars['BigInt']['output'];
  blockNumber: Scalars['BigInt']['output'];
  currency: Currency;
  id: Scalars['ID']['output'];
  occupant: Scalars['Bytes']['output'];
  slot: Slot;
  timestamp: Scalars['BigInt']['output'];
  tx: Scalars['Bytes']['output'];
};

export type WithdrawnEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  amount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  amount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not?: InputMaybe<Scalars['BigInt']['input']>;
  amount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  and?: InputMaybe<Array<InputMaybe<WithdrawnEvent_Filter>>>;
  blockNumber?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_gte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  blockNumber_lt?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_lte?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not?: InputMaybe<Scalars['BigInt']['input']>;
  blockNumber_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  currency?: InputMaybe<Scalars['String']['input']>;
  currency_?: InputMaybe<Currency_Filter>;
  currency_contains?: InputMaybe<Scalars['String']['input']>;
  currency_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_gt?: InputMaybe<Scalars['String']['input']>;
  currency_gte?: InputMaybe<Scalars['String']['input']>;
  currency_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_lt?: InputMaybe<Scalars['String']['input']>;
  currency_lte?: InputMaybe<Scalars['String']['input']>;
  currency_not?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains?: InputMaybe<Scalars['String']['input']>;
  currency_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  currency_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with?: InputMaybe<Scalars['String']['input']>;
  currency_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  occupant?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_contains?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_gt?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_gte?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  occupant_lt?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_lte?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_not?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  occupant_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  or?: InputMaybe<Array<InputMaybe<WithdrawnEvent_Filter>>>;
  slot?: InputMaybe<Scalars['String']['input']>;
  slot_?: InputMaybe<Slot_Filter>;
  slot_contains?: InputMaybe<Scalars['String']['input']>;
  slot_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_gt?: InputMaybe<Scalars['String']['input']>;
  slot_gte?: InputMaybe<Scalars['String']['input']>;
  slot_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_lt?: InputMaybe<Scalars['String']['input']>;
  slot_lte?: InputMaybe<Scalars['String']['input']>;
  slot_not?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains?: InputMaybe<Scalars['String']['input']>;
  slot_not_contains_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_ends_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  slot_not_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_not_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with?: InputMaybe<Scalars['String']['input']>;
  slot_starts_with_nocase?: InputMaybe<Scalars['String']['input']>;
  timestamp?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_gte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  timestamp_lt?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_lte?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not?: InputMaybe<Scalars['BigInt']['input']>;
  timestamp_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  tx?: InputMaybe<Scalars['Bytes']['input']>;
  tx_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_gte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  tx_lt?: InputMaybe<Scalars['Bytes']['input']>;
  tx_lte?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  tx_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
};

export type WithdrawnEvent_OrderBy =
  | 'amount'
  | 'blockNumber'
  | 'currency'
  | 'currency__decimals'
  | 'currency__id'
  | 'currency__name'
  | 'currency__symbol'
  | 'id'
  | 'occupant'
  | 'slot'
  | 'slot__collectedTax'
  | 'slot__createdAt'
  | 'slot__createdTx'
  | 'slot__deposit'
  | 'slot__id'
  | 'slot__liquidationBountyBps'
  | 'slot__manager'
  | 'slot__minDepositSeconds'
  | 'slot__mutableModule'
  | 'slot__mutableTax'
  | 'slot__occupant'
  | 'slot__price'
  | 'slot__recipient'
  | 'slot__taxPercentage'
  | 'slot__totalCollected'
  | 'slot__updatedAt'
  | 'timestamp'
  | 'tx';

export type _Block_ = {
  __typename?: '_Block_';
  /** The hash of the block */
  hash?: Maybe<Scalars['Bytes']['output']>;
  /** The block number */
  number: Scalars['Int']['output'];
  /** The hash of the parent block */
  parentHash?: Maybe<Scalars['Bytes']['output']>;
  /** Integer representation of the timestamp stored in blocks for the chain */
  timestamp?: Maybe<Scalars['Int']['output']>;
};

/** The type for the top-level _meta field */
export type _Meta_ = {
  __typename?: '_Meta_';
  /**
   * Information about a specific subgraph block. The hash of the block
   * will be null if the _meta field has a block constraint that asks for
   * a block number. It will be filled if the _meta field has no block constraint
   * and therefore asks for the latest  block
   */
  block: _Block_;
  /** The deployment ID */
  deployment: Scalars['String']['output'];
  /** If `true`, the subgraph encountered indexing errors at some past block */
  hasIndexingErrors: Scalars['Boolean']['output'];
};

export type _SubgraphErrorPolicy_ =
  /** Data will be returned even if the subgraph has indexing errors */
  | 'allow'
  /** If the subgraph has indexing errors, data will be omitted. The default. */
  | 'deny';

export type AccountFieldsFragment = { __typename?: 'Account', id: string, type: AccountType, slotCount: number, occupiedCount: number, slotsAsRecipient: Array<{ __typename?: 'Slot', id: string }>, slotsAsOccupant: Array<{ __typename?: 'Slot', id: string }> };

export type GetAccountQueryVariables = Exact<{
  id: Scalars['ID']['input'];
  block?: InputMaybe<Block_Height>;
}>;


export type GetAccountQuery = { __typename?: 'Query', account?: { __typename?: 'Account', id: string, type: AccountType, slotCount: number, occupiedCount: number, slotsAsRecipient: Array<{ __typename?: 'Slot', id: string }>, slotsAsOccupant: Array<{ __typename?: 'Slot', id: string }> } | null };

export type GetAccountsQueryVariables = Exact<{
  first: Scalars['Int']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Account_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Account_Filter>;
  block?: InputMaybe<Block_Height>;
}>;


export type GetAccountsQuery = { __typename?: 'Query', accounts: Array<{ __typename?: 'Account', id: string, type: AccountType, slotCount: number, occupiedCount: number, slotsAsRecipient: Array<{ __typename?: 'Slot', id: string }>, slotsAsOccupant: Array<{ __typename?: 'Slot', id: string }> }> };

export type CurrencyFieldsFragment = { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number };

export type GetSlotDeployedEventsQueryVariables = Exact<{
  first: Scalars['Int']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SlotDeployedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<SlotDeployedEvent_Filter>;
  block?: InputMaybe<Block_Height>;
}>;


export type GetSlotDeployedEventsQuery = { __typename?: 'Query', slotDeployedEvents: Array<{ __typename?: 'SlotDeployedEvent', id: string, recipient: string, manager: string, mutableTax: boolean, mutableModule: boolean, taxPercentage: string, module: string, liquidationBountyBps: string, minDepositSeconds: string, deployer: string, timestamp: string, blockNumber: string, tx: string, slot: { __typename?: 'Slot', id: string }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }> };

export type GetRecentEventsQueryVariables = Exact<{
  first: Scalars['Int']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetRecentEventsQuery = { __typename?: 'Query', slotDeployedEvents: Array<{ __typename?: 'SlotDeployedEvent', id: string, recipient: string, deployer: string, timestamp: string, tx: string, slot: { __typename?: 'Slot', id: string }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }>, boughtEvents: Array<{ __typename?: 'BoughtEvent', id: string, buyer: string, previousOccupant: string, price: string, selfAssessedPrice: string, deposit: string, timestamp: string, tx: string, slot: { __typename?: 'Slot', id: string }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }>, releasedEvents: Array<{ __typename?: 'ReleasedEvent', id: string, occupant: string, refund: string, timestamp: string, tx: string, slot: { __typename?: 'Slot', id: string }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }>, liquidatedEvents: Array<{ __typename?: 'LiquidatedEvent', id: string, liquidator: string, occupant: string, bounty: string, timestamp: string, tx: string, slot: { __typename?: 'Slot', id: string }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }>, priceUpdatedEvents: Array<{ __typename?: 'PriceUpdatedEvent', id: string, oldPrice: string, newPrice: string, timestamp: string, tx: string, slot: { __typename?: 'Slot', id: string }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }>, depositedEvents: Array<{ __typename?: 'DepositedEvent', id: string, depositor: string, amount: string, timestamp: string, tx: string, slot: { __typename?: 'Slot', id: string }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }>, withdrawnEvents: Array<{ __typename?: 'WithdrawnEvent', id: string, occupant: string, amount: string, timestamp: string, tx: string, slot: { __typename?: 'Slot', id: string }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }>, taxCollectedEvents: Array<{ __typename?: 'TaxCollectedEvent', id: string, recipient: string, amount: string, timestamp: string, tx: string, slot: { __typename?: 'Slot', id: string }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }>, taxUpdateProposedEvents: Array<{ __typename?: 'TaxUpdateProposedEvent', id: string, newPercentage: string, timestamp: string, tx: string, slot: { __typename?: 'Slot', id: string } }>, moduleUpdateProposedEvents: Array<{ __typename?: 'ModuleUpdateProposedEvent', id: string, newModule: string, timestamp: string, tx: string, slot: { __typename?: 'Slot', id: string } }>, pendingUpdateCancelledEvents: Array<{ __typename?: 'PendingUpdateCancelledEvent', id: string, timestamp: string, tx: string, slot: { __typename?: 'Slot', id: string } }> };

export type GetBoughtEventsQueryVariables = Exact<{
  first: Scalars['Int']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<BoughtEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<BoughtEvent_Filter>;
  block?: InputMaybe<Block_Height>;
}>;


export type GetBoughtEventsQuery = { __typename?: 'Query', boughtEvents: Array<{ __typename?: 'BoughtEvent', id: string, buyer: string, previousOccupant: string, price: string, deposit: string, selfAssessedPrice: string, timestamp: string, blockNumber: string, tx: string, slot: { __typename?: 'Slot', id: string }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }> };

export type GetReleasedEventsQueryVariables = Exact<{
  first: Scalars['Int']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<ReleasedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<ReleasedEvent_Filter>;
  block?: InputMaybe<Block_Height>;
}>;


export type GetReleasedEventsQuery = { __typename?: 'Query', releasedEvents: Array<{ __typename?: 'ReleasedEvent', id: string, occupant: string, refund: string, timestamp: string, blockNumber: string, tx: string, slot: { __typename?: 'Slot', id: string }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }> };

export type GetLiquidatedEventsQueryVariables = Exact<{
  first: Scalars['Int']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<LiquidatedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<LiquidatedEvent_Filter>;
  block?: InputMaybe<Block_Height>;
}>;


export type GetLiquidatedEventsQuery = { __typename?: 'Query', liquidatedEvents: Array<{ __typename?: 'LiquidatedEvent', id: string, liquidator: string, occupant: string, bounty: string, timestamp: string, blockNumber: string, tx: string, slot: { __typename?: 'Slot', id: string }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }> };

export type GetSettledEventsQueryVariables = Exact<{
  first: Scalars['Int']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<SettledEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<SettledEvent_Filter>;
  block?: InputMaybe<Block_Height>;
}>;


export type GetSettledEventsQuery = { __typename?: 'Query', settledEvents: Array<{ __typename?: 'SettledEvent', id: string, taxOwed: string, taxPaid: string, depositRemaining: string, timestamp: string, blockNumber: string, tx: string, slot: { __typename?: 'Slot', id: string }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }> };

export type GetTaxCollectedEventsQueryVariables = Exact<{
  first: Scalars['Int']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<TaxCollectedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<TaxCollectedEvent_Filter>;
  block?: InputMaybe<Block_Height>;
}>;


export type GetTaxCollectedEventsQuery = { __typename?: 'Query', taxCollectedEvents: Array<{ __typename?: 'TaxCollectedEvent', id: string, recipient: string, amount: string, timestamp: string, blockNumber: string, tx: string, slot: { __typename?: 'Slot', id: string }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }> };

export type GetDepositedEventsQueryVariables = Exact<{
  first: Scalars['Int']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<DepositedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<DepositedEvent_Filter>;
  block?: InputMaybe<Block_Height>;
}>;


export type GetDepositedEventsQuery = { __typename?: 'Query', depositedEvents: Array<{ __typename?: 'DepositedEvent', id: string, depositor: string, amount: string, timestamp: string, blockNumber: string, tx: string, slot: { __typename?: 'Slot', id: string }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }> };

export type GetWithdrawnEventsQueryVariables = Exact<{
  first: Scalars['Int']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<WithdrawnEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<WithdrawnEvent_Filter>;
  block?: InputMaybe<Block_Height>;
}>;


export type GetWithdrawnEventsQuery = { __typename?: 'Query', withdrawnEvents: Array<{ __typename?: 'WithdrawnEvent', id: string, occupant: string, amount: string, timestamp: string, blockNumber: string, tx: string, slot: { __typename?: 'Slot', id: string }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }> };

export type GetPriceUpdatedEventsQueryVariables = Exact<{
  first: Scalars['Int']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<PriceUpdatedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<PriceUpdatedEvent_Filter>;
  block?: InputMaybe<Block_Height>;
}>;


export type GetPriceUpdatedEventsQuery = { __typename?: 'Query', priceUpdatedEvents: Array<{ __typename?: 'PriceUpdatedEvent', id: string, oldPrice: string, newPrice: string, timestamp: string, blockNumber: string, tx: string, slot: { __typename?: 'Slot', id: string }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }> };

export type GetSlotActivityQueryVariables = Exact<{
  slotId: Scalars['String']['input'];
  first: Scalars['Int']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetSlotActivityQuery = { __typename?: 'Query', boughtEvents: Array<{ __typename?: 'BoughtEvent', id: string, buyer: string, previousOccupant: string, price: string, selfAssessedPrice: string, deposit: string, timestamp: string, tx: string, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }>, releasedEvents: Array<{ __typename?: 'ReleasedEvent', id: string, occupant: string, refund: string, timestamp: string, tx: string, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }>, liquidatedEvents: Array<{ __typename?: 'LiquidatedEvent', id: string, liquidator: string, occupant: string, bounty: string, timestamp: string, tx: string, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }>, priceUpdatedEvents: Array<{ __typename?: 'PriceUpdatedEvent', id: string, oldPrice: string, newPrice: string, timestamp: string, tx: string, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }>, depositedEvents: Array<{ __typename?: 'DepositedEvent', id: string, depositor: string, amount: string, timestamp: string, tx: string, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }>, withdrawnEvents: Array<{ __typename?: 'WithdrawnEvent', id: string, occupant: string, amount: string, timestamp: string, tx: string, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }>, taxCollectedEvents: Array<{ __typename?: 'TaxCollectedEvent', id: string, recipient: string, amount: string, timestamp: string, tx: string, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number } }>, taxUpdateProposedEvents: Array<{ __typename?: 'TaxUpdateProposedEvent', id: string, newPercentage: string, timestamp: string, tx: string }>, moduleUpdateProposedEvents: Array<{ __typename?: 'ModuleUpdateProposedEvent', id: string, newModule: string, timestamp: string, tx: string }>, pendingUpdateCancelledEvents: Array<{ __typename?: 'PendingUpdateCancelledEvent', id: string, timestamp: string, tx: string }> };

export type GetFactoryQueryVariables = Exact<{ [key: string]: never; }>;


export type GetFactoryQuery = { __typename?: 'Query', factories: Array<{ __typename?: 'Factory', id: string, slotCount: string }> };

export type GetModulesQueryVariables = Exact<{
  first: Scalars['Int']['input'];
}>;


export type GetModulesQuery = { __typename?: 'Query', modules: Array<{ __typename?: 'Module', id: string, verified: boolean, name: string, version: string }> };

export type MetadataSlotFieldsFragment = { __typename?: 'MetadataSlot', id: string, uri: string, rawJson?: string | null, adType?: string | null, updatedBy: string, updateCount: string, createdAt: string, createdTx: string, updatedAt: string, updatedTx: string, slot: { __typename?: 'Slot', id: string, recipient: string, occupant?: string | null, price: string, deposit: string, currency: { __typename?: 'Currency', id: string, symbol?: string | null, decimals: number } } };

export type GetMetadataSlotsQueryVariables = Exact<{
  first?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<MetadataSlot_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
}>;


export type GetMetadataSlotsQuery = { __typename?: 'Query', metadataSlots: Array<{ __typename?: 'MetadataSlot', id: string, uri: string, rawJson?: string | null, adType?: string | null, updatedBy: string, updateCount: string, createdAt: string, createdTx: string, updatedAt: string, updatedTx: string, slot: { __typename?: 'Slot', id: string, recipient: string, occupant?: string | null, price: string, deposit: string, currency: { __typename?: 'Currency', id: string, symbol?: string | null, decimals: number } } }> };

export type GetMetadataSlotQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type GetMetadataSlotQuery = { __typename?: 'Query', metadataSlot?: { __typename?: 'MetadataSlot', id: string, uri: string, rawJson?: string | null, adType?: string | null, updatedBy: string, updateCount: string, createdAt: string, createdTx: string, updatedAt: string, updatedTx: string, slot: { __typename?: 'Slot', id: string, recipient: string, occupant?: string | null, price: string, deposit: string, currency: { __typename?: 'Currency', id: string, symbol?: string | null, decimals: number } } } | null };

export type GetMetadataSlotsByRecipientQueryVariables = Exact<{
  recipient: Scalars['Bytes']['input'];
  first?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetMetadataSlotsByRecipientQuery = { __typename?: 'Query', metadataSlots: Array<{ __typename?: 'MetadataSlot', id: string, uri: string, rawJson?: string | null, adType?: string | null, updatedBy: string, updateCount: string, createdAt: string, createdTx: string, updatedAt: string, updatedTx: string, slot: { __typename?: 'Slot', id: string, recipient: string, occupant?: string | null, price: string, deposit: string, currency: { __typename?: 'Currency', id: string, symbol?: string | null, decimals: number } } }> };

export type GetMetadataUpdatedEventsQueryVariables = Exact<{
  slot?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<MetadataUpdatedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
}>;


export type GetMetadataUpdatedEventsQuery = { __typename?: 'Query', metadataUpdatedEvents: Array<{ __typename?: 'MetadataUpdatedEvent', id: string, uri: string, rawJson?: string | null, adType?: string | null, timestamp: string, blockNumber: string, tx: string, slot: { __typename?: 'Slot', id: string }, author: { __typename?: 'Account', id: string, type: AccountType } }> };

export type SlotFieldsFragment = { __typename?: 'Slot', id: string, recipient: string, manager: string, mutableTax: boolean, mutableModule: boolean, taxPercentage: string, occupant?: string | null, price: string, deposit: string, collectedTax: string, totalCollected: string, liquidationBountyBps: string, minDepositSeconds: string, createdAt: string, createdTx: string, updatedAt: string, recipientAccount: { __typename?: 'Account', id: string, type: AccountType, slotCount: number, occupiedCount: number }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number }, module?: { __typename?: 'Module', id: string, verified: boolean, name: string, version: string } | null, occupantAccount?: { __typename?: 'Account', id: string, type: AccountType, slotCount: number, occupiedCount: number } | null };

export type GetSlotsQueryVariables = Exact<{
  first: Scalars['Int']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Slot_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Slot_Filter>;
  block?: InputMaybe<Block_Height>;
}>;


export type GetSlotsQuery = { __typename?: 'Query', slots: Array<{ __typename?: 'Slot', id: string, recipient: string, manager: string, mutableTax: boolean, mutableModule: boolean, taxPercentage: string, occupant?: string | null, price: string, deposit: string, collectedTax: string, totalCollected: string, liquidationBountyBps: string, minDepositSeconds: string, createdAt: string, createdTx: string, updatedAt: string, recipientAccount: { __typename?: 'Account', id: string, type: AccountType, slotCount: number, occupiedCount: number }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number }, module?: { __typename?: 'Module', id: string, verified: boolean, name: string, version: string } | null, occupantAccount?: { __typename?: 'Account', id: string, type: AccountType, slotCount: number, occupiedCount: number } | null }> };

export type GetSlotQueryVariables = Exact<{
  id: Scalars['ID']['input'];
  block?: InputMaybe<Block_Height>;
}>;


export type GetSlotQuery = { __typename?: 'Query', slot?: { __typename?: 'Slot', id: string, recipient: string, manager: string, mutableTax: boolean, mutableModule: boolean, taxPercentage: string, occupant?: string | null, price: string, deposit: string, collectedTax: string, totalCollected: string, liquidationBountyBps: string, minDepositSeconds: string, createdAt: string, createdTx: string, updatedAt: string, recipientAccount: { __typename?: 'Account', id: string, type: AccountType, slotCount: number, occupiedCount: number }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number }, module?: { __typename?: 'Module', id: string, verified: boolean, name: string, version: string } | null, occupantAccount?: { __typename?: 'Account', id: string, type: AccountType, slotCount: number, occupiedCount: number } | null } | null };

export type GetSlotsByRecipientQueryVariables = Exact<{
  recipient: Scalars['Bytes']['input'];
  first: Scalars['Int']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Slot_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  block?: InputMaybe<Block_Height>;
}>;


export type GetSlotsByRecipientQuery = { __typename?: 'Query', slots: Array<{ __typename?: 'Slot', id: string, recipient: string, manager: string, mutableTax: boolean, mutableModule: boolean, taxPercentage: string, occupant?: string | null, price: string, deposit: string, collectedTax: string, totalCollected: string, liquidationBountyBps: string, minDepositSeconds: string, createdAt: string, createdTx: string, updatedAt: string, recipientAccount: { __typename?: 'Account', id: string, type: AccountType, slotCount: number, occupiedCount: number }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number }, module?: { __typename?: 'Module', id: string, verified: boolean, name: string, version: string } | null, occupantAccount?: { __typename?: 'Account', id: string, type: AccountType, slotCount: number, occupiedCount: number } | null }> };

export type GetSlotsByOccupantQueryVariables = Exact<{
  occupant: Scalars['Bytes']['input'];
  first: Scalars['Int']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Slot_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  block?: InputMaybe<Block_Height>;
}>;


export type GetSlotsByOccupantQuery = { __typename?: 'Query', slots: Array<{ __typename?: 'Slot', id: string, recipient: string, manager: string, mutableTax: boolean, mutableModule: boolean, taxPercentage: string, occupant?: string | null, price: string, deposit: string, collectedTax: string, totalCollected: string, liquidationBountyBps: string, minDepositSeconds: string, createdAt: string, createdTx: string, updatedAt: string, recipientAccount: { __typename?: 'Account', id: string, type: AccountType, slotCount: number, occupiedCount: number }, currency: { __typename?: 'Currency', id: string, name?: string | null, symbol?: string | null, decimals: number }, module?: { __typename?: 'Module', id: string, verified: boolean, name: string, version: string } | null, occupantAccount?: { __typename?: 'Account', id: string, type: AccountType, slotCount: number, occupiedCount: number } | null }> };

export const AccountFieldsFragmentDoc = gql`
    fragment AccountFields on Account {
  id
  type
  slotCount
  occupiedCount
  slotsAsRecipient {
    id
  }
  slotsAsOccupant {
    id
  }
}
    `;
export const CurrencyFieldsFragmentDoc = gql`
    fragment CurrencyFields on Currency {
  id
  name
  symbol
  decimals
}
    `;
export const MetadataSlotFieldsFragmentDoc = gql`
    fragment MetadataSlotFields on MetadataSlot {
  id
  uri
  rawJson
  adType
  updatedBy
  updateCount
  createdAt
  createdTx
  updatedAt
  updatedTx
  slot {
    id
    recipient
    occupant
    price
    deposit
    currency {
      id
      symbol
      decimals
    }
  }
}
    `;
export const SlotFieldsFragmentDoc = gql`
    fragment SlotFields on Slot {
  id
  recipient
  recipientAccount {
    id
    type
    slotCount
    occupiedCount
  }
  currency {
    id
    name
    symbol
    decimals
  }
  manager
  mutableTax
  mutableModule
  taxPercentage
  module {
    id
    verified
    name
    version
  }
  occupant
  occupantAccount {
    id
    type
    slotCount
    occupiedCount
  }
  price
  deposit
  collectedTax
  totalCollected
  liquidationBountyBps
  minDepositSeconds
  createdAt
  createdTx
  updatedAt
}
    `;
export const GetAccountDocument = gql`
    query GetAccount($id: ID!, $block: Block_height) {
  account(id: $id, block: $block) {
    ...AccountFields
  }
}
    ${AccountFieldsFragmentDoc}`;
export const GetAccountsDocument = gql`
    query GetAccounts($first: Int!, $skip: Int, $orderBy: Account_orderBy, $orderDirection: OrderDirection, $where: Account_filter, $block: Block_height) {
  accounts(
    first: $first
    skip: $skip
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: $where
    block: $block
  ) {
    ...AccountFields
  }
}
    ${AccountFieldsFragmentDoc}`;
export const GetSlotDeployedEventsDocument = gql`
    query GetSlotDeployedEvents($first: Int!, $skip: Int, $orderBy: SlotDeployedEvent_orderBy, $orderDirection: OrderDirection, $where: SlotDeployedEvent_filter, $block: Block_height) {
  slotDeployedEvents(
    first: $first
    skip: $skip
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: $where
    block: $block
  ) {
    id
    slot {
      id
    }
    recipient
    currency {
      ...CurrencyFields
    }
    manager
    mutableTax
    mutableModule
    taxPercentage
    module
    liquidationBountyBps
    minDepositSeconds
    deployer
    timestamp
    blockNumber
    tx
  }
}
    ${CurrencyFieldsFragmentDoc}`;
export const GetRecentEventsDocument = gql`
    query GetRecentEvents($first: Int!, $skip: Int) {
  slotDeployedEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    slot {
      id
    }
    recipient
    currency {
      ...CurrencyFields
    }
    deployer
    timestamp
    tx
  }
  boughtEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    slot {
      id
    }
    currency {
      ...CurrencyFields
    }
    buyer
    previousOccupant
    price
    selfAssessedPrice
    deposit
    timestamp
    tx
  }
  releasedEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    slot {
      id
    }
    currency {
      ...CurrencyFields
    }
    occupant
    refund
    timestamp
    tx
  }
  liquidatedEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    slot {
      id
    }
    currency {
      ...CurrencyFields
    }
    liquidator
    occupant
    bounty
    timestamp
    tx
  }
  priceUpdatedEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    slot {
      id
    }
    currency {
      ...CurrencyFields
    }
    oldPrice
    newPrice
    timestamp
    tx
  }
  depositedEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    slot {
      id
    }
    currency {
      ...CurrencyFields
    }
    depositor
    amount
    timestamp
    tx
  }
  withdrawnEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    slot {
      id
    }
    currency {
      ...CurrencyFields
    }
    occupant
    amount
    timestamp
    tx
  }
  taxCollectedEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    slot {
      id
    }
    currency {
      ...CurrencyFields
    }
    recipient
    amount
    timestamp
    tx
  }
  taxUpdateProposedEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    slot {
      id
    }
    newPercentage
    timestamp
    tx
  }
  moduleUpdateProposedEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    slot {
      id
    }
    newModule
    timestamp
    tx
  }
  pendingUpdateCancelledEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
  ) {
    id
    slot {
      id
    }
    timestamp
    tx
  }
}
    ${CurrencyFieldsFragmentDoc}`;
export const GetBoughtEventsDocument = gql`
    query GetBoughtEvents($first: Int!, $skip: Int, $orderBy: BoughtEvent_orderBy, $orderDirection: OrderDirection, $where: BoughtEvent_filter, $block: Block_height) {
  boughtEvents(
    first: $first
    skip: $skip
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: $where
    block: $block
  ) {
    id
    slot {
      id
    }
    currency {
      ...CurrencyFields
    }
    buyer
    previousOccupant
    price
    deposit
    selfAssessedPrice
    timestamp
    blockNumber
    tx
  }
}
    ${CurrencyFieldsFragmentDoc}`;
export const GetReleasedEventsDocument = gql`
    query GetReleasedEvents($first: Int!, $skip: Int, $orderBy: ReleasedEvent_orderBy, $orderDirection: OrderDirection, $where: ReleasedEvent_filter, $block: Block_height) {
  releasedEvents(
    first: $first
    skip: $skip
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: $where
    block: $block
  ) {
    id
    slot {
      id
    }
    currency {
      ...CurrencyFields
    }
    occupant
    refund
    timestamp
    blockNumber
    tx
  }
}
    ${CurrencyFieldsFragmentDoc}`;
export const GetLiquidatedEventsDocument = gql`
    query GetLiquidatedEvents($first: Int!, $skip: Int, $orderBy: LiquidatedEvent_orderBy, $orderDirection: OrderDirection, $where: LiquidatedEvent_filter, $block: Block_height) {
  liquidatedEvents(
    first: $first
    skip: $skip
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: $where
    block: $block
  ) {
    id
    slot {
      id
    }
    currency {
      ...CurrencyFields
    }
    liquidator
    occupant
    bounty
    timestamp
    blockNumber
    tx
  }
}
    ${CurrencyFieldsFragmentDoc}`;
export const GetSettledEventsDocument = gql`
    query GetSettledEvents($first: Int!, $skip: Int, $orderBy: SettledEvent_orderBy, $orderDirection: OrderDirection, $where: SettledEvent_filter, $block: Block_height) {
  settledEvents(
    first: $first
    skip: $skip
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: $where
    block: $block
  ) {
    id
    slot {
      id
    }
    currency {
      ...CurrencyFields
    }
    taxOwed
    taxPaid
    depositRemaining
    timestamp
    blockNumber
    tx
  }
}
    ${CurrencyFieldsFragmentDoc}`;
export const GetTaxCollectedEventsDocument = gql`
    query GetTaxCollectedEvents($first: Int!, $skip: Int, $orderBy: TaxCollectedEvent_orderBy, $orderDirection: OrderDirection, $where: TaxCollectedEvent_filter, $block: Block_height) {
  taxCollectedEvents(
    first: $first
    skip: $skip
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: $where
    block: $block
  ) {
    id
    slot {
      id
    }
    currency {
      ...CurrencyFields
    }
    recipient
    amount
    timestamp
    blockNumber
    tx
  }
}
    ${CurrencyFieldsFragmentDoc}`;
export const GetDepositedEventsDocument = gql`
    query GetDepositedEvents($first: Int!, $skip: Int, $orderBy: DepositedEvent_orderBy, $orderDirection: OrderDirection, $where: DepositedEvent_filter, $block: Block_height) {
  depositedEvents(
    first: $first
    skip: $skip
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: $where
    block: $block
  ) {
    id
    slot {
      id
    }
    currency {
      ...CurrencyFields
    }
    depositor
    amount
    timestamp
    blockNumber
    tx
  }
}
    ${CurrencyFieldsFragmentDoc}`;
export const GetWithdrawnEventsDocument = gql`
    query GetWithdrawnEvents($first: Int!, $skip: Int, $orderBy: WithdrawnEvent_orderBy, $orderDirection: OrderDirection, $where: WithdrawnEvent_filter, $block: Block_height) {
  withdrawnEvents(
    first: $first
    skip: $skip
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: $where
    block: $block
  ) {
    id
    slot {
      id
    }
    currency {
      ...CurrencyFields
    }
    occupant
    amount
    timestamp
    blockNumber
    tx
  }
}
    ${CurrencyFieldsFragmentDoc}`;
export const GetPriceUpdatedEventsDocument = gql`
    query GetPriceUpdatedEvents($first: Int!, $skip: Int, $orderBy: PriceUpdatedEvent_orderBy, $orderDirection: OrderDirection, $where: PriceUpdatedEvent_filter, $block: Block_height) {
  priceUpdatedEvents(
    first: $first
    skip: $skip
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: $where
    block: $block
  ) {
    id
    slot {
      id
    }
    currency {
      ...CurrencyFields
    }
    oldPrice
    newPrice
    timestamp
    blockNumber
    tx
  }
}
    ${CurrencyFieldsFragmentDoc}`;
export const GetSlotActivityDocument = gql`
    query GetSlotActivity($slotId: String!, $first: Int!, $skip: Int) {
  boughtEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
    where: {slot: $slotId}
  ) {
    id
    currency {
      ...CurrencyFields
    }
    buyer
    previousOccupant
    price
    selfAssessedPrice
    deposit
    timestamp
    tx
  }
  releasedEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
    where: {slot: $slotId}
  ) {
    id
    currency {
      ...CurrencyFields
    }
    occupant
    refund
    timestamp
    tx
  }
  liquidatedEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
    where: {slot: $slotId}
  ) {
    id
    currency {
      ...CurrencyFields
    }
    liquidator
    occupant
    bounty
    timestamp
    tx
  }
  priceUpdatedEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
    where: {slot: $slotId}
  ) {
    id
    currency {
      ...CurrencyFields
    }
    oldPrice
    newPrice
    timestamp
    tx
  }
  depositedEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
    where: {slot: $slotId}
  ) {
    id
    currency {
      ...CurrencyFields
    }
    depositor
    amount
    timestamp
    tx
  }
  withdrawnEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
    where: {slot: $slotId}
  ) {
    id
    currency {
      ...CurrencyFields
    }
    occupant
    amount
    timestamp
    tx
  }
  taxCollectedEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
    where: {slot: $slotId}
  ) {
    id
    currency {
      ...CurrencyFields
    }
    recipient
    amount
    timestamp
    tx
  }
  taxUpdateProposedEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
    where: {slot: $slotId}
  ) {
    id
    newPercentage
    timestamp
    tx
  }
  moduleUpdateProposedEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
    where: {slot: $slotId}
  ) {
    id
    newModule
    timestamp
    tx
  }
  pendingUpdateCancelledEvents(
    first: $first
    skip: $skip
    orderBy: timestamp
    orderDirection: desc
    where: {slot: $slotId}
  ) {
    id
    timestamp
    tx
  }
}
    ${CurrencyFieldsFragmentDoc}`;
export const GetFactoryDocument = gql`
    query GetFactory {
  factories(first: 1) {
    id
    slotCount
  }
}
    `;
export const GetModulesDocument = gql`
    query GetModules($first: Int!) {
  modules(first: $first) {
    id
    verified
    name
    version
  }
}
    `;
export const GetMetadataSlotsDocument = gql`
    query GetMetadataSlots($first: Int = 100, $skip: Int = 0, $orderBy: MetadataSlot_orderBy = updatedAt, $orderDirection: OrderDirection = desc) {
  metadataSlots(
    first: $first
    skip: $skip
    orderBy: $orderBy
    orderDirection: $orderDirection
  ) {
    ...MetadataSlotFields
  }
}
    ${MetadataSlotFieldsFragmentDoc}`;
export const GetMetadataSlotDocument = gql`
    query GetMetadataSlot($id: ID!) {
  metadataSlot(id: $id) {
    ...MetadataSlotFields
  }
}
    ${MetadataSlotFieldsFragmentDoc}`;
export const GetMetadataSlotsByRecipientDocument = gql`
    query GetMetadataSlotsByRecipient($recipient: Bytes!, $first: Int = 100) {
  metadataSlots(
    first: $first
    where: {slot_: {recipient: $recipient}}
    orderBy: updatedAt
    orderDirection: desc
  ) {
    ...MetadataSlotFields
  }
}
    ${MetadataSlotFieldsFragmentDoc}`;
export const GetMetadataUpdatedEventsDocument = gql`
    query GetMetadataUpdatedEvents($slot: String, $first: Int = 50, $orderBy: MetadataUpdatedEvent_orderBy = timestamp, $orderDirection: OrderDirection = desc) {
  metadataUpdatedEvents(
    first: $first
    where: {slot: $slot}
    orderBy: $orderBy
    orderDirection: $orderDirection
  ) {
    id
    slot {
      id
    }
    author {
      id
      type
    }
    uri
    rawJson
    adType
    timestamp
    blockNumber
    tx
  }
}
    `;
export const GetSlotsDocument = gql`
    query GetSlots($first: Int!, $skip: Int, $orderBy: Slot_orderBy, $orderDirection: OrderDirection, $where: Slot_filter, $block: Block_height) {
  slots(
    first: $first
    skip: $skip
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: $where
    block: $block
  ) {
    ...SlotFields
  }
}
    ${SlotFieldsFragmentDoc}`;
export const GetSlotDocument = gql`
    query GetSlot($id: ID!, $block: Block_height) {
  slot(id: $id, block: $block) {
    ...SlotFields
  }
}
    ${SlotFieldsFragmentDoc}`;
export const GetSlotsByRecipientDocument = gql`
    query GetSlotsByRecipient($recipient: Bytes!, $first: Int!, $skip: Int, $orderBy: Slot_orderBy, $orderDirection: OrderDirection, $block: Block_height) {
  slots(
    first: $first
    skip: $skip
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: {recipient: $recipient}
    block: $block
  ) {
    ...SlotFields
  }
}
    ${SlotFieldsFragmentDoc}`;
export const GetSlotsByOccupantDocument = gql`
    query GetSlotsByOccupant($occupant: Bytes!, $first: Int!, $skip: Int, $orderBy: Slot_orderBy, $orderDirection: OrderDirection, $block: Block_height) {
  slots(
    first: $first
    skip: $skip
    orderBy: $orderBy
    orderDirection: $orderDirection
    where: {occupant: $occupant}
    block: $block
  ) {
    ...SlotFields
  }
}
    ${SlotFieldsFragmentDoc}`;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    GetAccount(variables: GetAccountQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetAccountQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetAccountQuery>({ document: GetAccountDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetAccount', 'query', variables);
    },
    GetAccounts(variables: GetAccountsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetAccountsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetAccountsQuery>({ document: GetAccountsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetAccounts', 'query', variables);
    },
    GetSlotDeployedEvents(variables: GetSlotDeployedEventsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetSlotDeployedEventsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetSlotDeployedEventsQuery>({ document: GetSlotDeployedEventsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetSlotDeployedEvents', 'query', variables);
    },
    GetRecentEvents(variables: GetRecentEventsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetRecentEventsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetRecentEventsQuery>({ document: GetRecentEventsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetRecentEvents', 'query', variables);
    },
    GetBoughtEvents(variables: GetBoughtEventsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetBoughtEventsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetBoughtEventsQuery>({ document: GetBoughtEventsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetBoughtEvents', 'query', variables);
    },
    GetReleasedEvents(variables: GetReleasedEventsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetReleasedEventsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetReleasedEventsQuery>({ document: GetReleasedEventsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetReleasedEvents', 'query', variables);
    },
    GetLiquidatedEvents(variables: GetLiquidatedEventsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetLiquidatedEventsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetLiquidatedEventsQuery>({ document: GetLiquidatedEventsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetLiquidatedEvents', 'query', variables);
    },
    GetSettledEvents(variables: GetSettledEventsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetSettledEventsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetSettledEventsQuery>({ document: GetSettledEventsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetSettledEvents', 'query', variables);
    },
    GetTaxCollectedEvents(variables: GetTaxCollectedEventsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetTaxCollectedEventsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetTaxCollectedEventsQuery>({ document: GetTaxCollectedEventsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetTaxCollectedEvents', 'query', variables);
    },
    GetDepositedEvents(variables: GetDepositedEventsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetDepositedEventsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetDepositedEventsQuery>({ document: GetDepositedEventsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetDepositedEvents', 'query', variables);
    },
    GetWithdrawnEvents(variables: GetWithdrawnEventsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetWithdrawnEventsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetWithdrawnEventsQuery>({ document: GetWithdrawnEventsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetWithdrawnEvents', 'query', variables);
    },
    GetPriceUpdatedEvents(variables: GetPriceUpdatedEventsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetPriceUpdatedEventsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetPriceUpdatedEventsQuery>({ document: GetPriceUpdatedEventsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetPriceUpdatedEvents', 'query', variables);
    },
    GetSlotActivity(variables: GetSlotActivityQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetSlotActivityQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetSlotActivityQuery>({ document: GetSlotActivityDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetSlotActivity', 'query', variables);
    },
    GetFactory(variables?: GetFactoryQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetFactoryQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetFactoryQuery>({ document: GetFactoryDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetFactory', 'query', variables);
    },
    GetModules(variables: GetModulesQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetModulesQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetModulesQuery>({ document: GetModulesDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetModules', 'query', variables);
    },
    GetMetadataSlots(variables?: GetMetadataSlotsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMetadataSlotsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMetadataSlotsQuery>({ document: GetMetadataSlotsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMetadataSlots', 'query', variables);
    },
    GetMetadataSlot(variables: GetMetadataSlotQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMetadataSlotQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMetadataSlotQuery>({ document: GetMetadataSlotDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMetadataSlot', 'query', variables);
    },
    GetMetadataSlotsByRecipient(variables: GetMetadataSlotsByRecipientQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMetadataSlotsByRecipientQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMetadataSlotsByRecipientQuery>({ document: GetMetadataSlotsByRecipientDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMetadataSlotsByRecipient', 'query', variables);
    },
    GetMetadataUpdatedEvents(variables?: GetMetadataUpdatedEventsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetMetadataUpdatedEventsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetMetadataUpdatedEventsQuery>({ document: GetMetadataUpdatedEventsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetMetadataUpdatedEvents', 'query', variables);
    },
    GetSlots(variables: GetSlotsQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetSlotsQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetSlotsQuery>({ document: GetSlotsDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetSlots', 'query', variables);
    },
    GetSlot(variables: GetSlotQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetSlotQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetSlotQuery>({ document: GetSlotDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetSlot', 'query', variables);
    },
    GetSlotsByRecipient(variables: GetSlotsByRecipientQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetSlotsByRecipientQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetSlotsByRecipientQuery>({ document: GetSlotsByRecipientDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetSlotsByRecipient', 'query', variables);
    },
    GetSlotsByOccupant(variables: GetSlotsByOccupantQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<GetSlotsByOccupantQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<GetSlotsByOccupantQuery>({ document: GetSlotsByOccupantDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'GetSlotsByOccupant', 'query', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;