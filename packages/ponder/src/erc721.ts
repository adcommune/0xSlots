import { ponder } from "ponder:registry";
import { nftCollection, nftToken } from "ponder:schema";
import { getOrCreateCurrency, lower } from "./helpers";

ponder.on("ERC721SlotsFactory:CollectionDeployed", async ({ event, context }) => {
  const chainId = context.chain.id;
  const id = lower(event.args.collection);
  const cur = await getOrCreateCurrency(context, event.args.currency);

  await context.db.insert(nftCollection).values({
    id,
    chainId,
    name: event.args.name,
    symbol: event.args.symbol,
    creator: lower(event.args.creator),
    factory: lower(event.args.slotFactory),
    currency: cur.id,
    taxPercentage: 0n,
    totalSupply: 0n,
    createdAt: event.block.timestamp,
    createdTx: event.transaction.hash,
  });
});

ponder.on("ERC721Slots:TokenMinted", async ({ event, context }) => {
  const chainId = context.chain.id;
  const collectionId = lower(event.log.address);
  await context.db
    .update(nftCollection, { id: collectionId })
    .set((row) => ({ totalSupply: row.totalSupply + 1n }));

  const id = `${collectionId}-${event.args.tokenId.toString()}`;
  await context.db.insert(nftToken).values({
    id,
    chainId,
    collection: collectionId,
    tokenId: event.args.tokenId,
    slot: lower(event.args.slot),
    uri: event.args.uri,
    mintedAt: event.block.timestamp,
    mintedTx: event.transaction.hash,
  });
});
