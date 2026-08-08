// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BaseScript, console2} from "./Base.s.sol";
import {MinimumPricePolicy} from "../src/policies/MinimumPricePolicy.sol";
import {MinimumPricePolicyFactory} from "../src/policies/MinimumPricePolicyFactory.sol";

/**
 * @title RedeployPricePolicyFactory
 * @notice Ships the price-policy factory that accepts `address(0)`, so a floor
 *         can be denominated in native ETH.
 *
 * @dev ── Why not just re-run DeployPolicyFactories ────────────────────────
 *      Because those scripts deploy BOTH factories, and only the price factory
 *      changed. `MinimumTenurePolicyFactory` is untouched by the native-ETH
 *      work, and redeploying it would orphan the three mainnet tenure policies
 *      the SDK vouches for — 1h, 1d and 7d — for no reason at all. A factory is
 *      the CREATE2 deployer for everything it makes, so every address it
 *      predicts moves with its bytecode.
 *
 *      ── The cost that IS unavoidable ─────────────────────────────────────
 *      `MinimumPricePolicyFactory` is not upgradeable, so accepting the
 *      sentinel means new bytecode, a new address, and therefore new predicted
 *      addresses for every price policy. The two mainnet USDC floors already in
 *      the vouched list ($1 and $10) keep working on any slot that uses them —
 *      the policy contracts themselves are unchanged and still deployed — but
 *      `resolvePolicy`'s CREATE2 provenance check will no longer name them,
 *      because it verifies against the current factory.
 *
 *      That is precisely the case `VOUCHED_POLICIES` calls "reason 2": a policy
 *      whose address cannot be derived. Their entries must STAY in
 *      packages/sdk/src/policies/vouched.ts, and the comment above them —
 *      which currently says they are present for reason 1, not reason 2 —
 *      needs updating to say the opposite. Delete them and every slot using
 *      them renders as a bare address.
 *
 *      ── Ordering ──────────────────────────────────────────────────────────
 *      Run AFTER the slot implementation upgrade. A floor is inert without a
 *      slot implementation that consults it, and on a native slot the old
 *      factory cannot produce one at all.
 */
contract RedeployPricePolicyFactory is BaseScript {
    /// @dev Feed USDC (USDCf), 6 decimals — the default currency on Base Sepolia.
    address constant USDCF = 0xFA28A416810e39a7142C7557e6e43407d765f627;

    /// @dev Circle USDC on Base, 6 decimals — the default currency on mainnet.
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

    /// @dev The native-ETH sentinel. Unambiguously 18 decimals, which is the
    ///      only thing binding a currency to a floor ever protected against.
    address constant NATIVE = address(0);

    /// @notice Base Sepolia. `forge script ... RedeployPricePolicyFactory`
    function run() external broadcastOn(DeployementChain.BaseSepolia) {
        _redeploy(USDCF, "USDCf");
    }

    /// @notice Base mainnet. `forge script ... --sig "runBase()"`
    function runBase() external broadcastOn(DeployementChain.Base) {
        _redeploy(USDC, "USDC");
    }

    function _redeploy(address stable, string memory stableSymbol) internal {
        address old = _readDeployment("MinimumPricePolicyFactory");
        console2.log("old factory   ", old);

        MinimumPricePolicyFactory priceF = new MinimumPricePolicyFactory();
        console2.log("new factory   ", address(priceF));
        require(address(priceF) != old, "bytecode unchanged: nothing to redeploy");

        // The point of the whole exercise: the old factory reverts
        // InvalidCurrency here.
        uint256[2] memory ethFloors = [uint256(0.001 ether), 0.01 ether];
        for (uint256 i = 0; i < ethFloors.length; i++) {
            address p = priceF.getOrDeploy(NATIVE, ethFloors[i]);
            require(priceF.verify(p), "eth floor must verify");
            require(
                address(MinimumPricePolicy(p).currency()) == NATIVE,
                "eth floor must be denominated in the sentinel"
            );
            console2.log("  floor ETH   ", ethFloors[i], p);
        }

        // Re-seed the stable floors so the create form's picker has equivalents
        // at the NEW factory. The old ones still exist and still work; they
        // simply verify against a factory that is no longer current.
        uint256[2] memory stableFloors = [uint256(1e6), 10e6];
        for (uint256 i = 0; i < stableFloors.length; i++) {
            address p = priceF.getOrDeploy(stable, stableFloors[i]);
            require(priceF.verify(p), "stable floor must verify");
            console2.log(stableSymbol, stableFloors[i], p);
        }

        // NOTE: the "a codeless currency is still rejected" check deliberately
        // does NOT live here. Inside a broadcast block, forge records every
        // state-changing call as a transaction to send — including one made
        // through a low-level `call` purely to observe it revert. That fails
        // the simulation and, on a real run, would broadcast a transaction
        // built to fail. Negative paths belong in the Foundry suite; a deploy
        // script should contain only transactions meant to land. Covered by
        // `test_Factory_RejectsCodelessCurrency` in
        // test/MinimumPricePolicy.t.sol.

        _saveDeployment(address(priceF), "MinimumPricePolicyFactory");

        console2.log("");
        console2.log("NEXT: update both registries with the new factory address");
        console2.log("  packages/contracts/src/addresses.ts  MINIMUM_PRICE_POLICY_FACTORY");
        console2.log("  packages/sdk/src/policies/vouched.ts keep the old USDC floors, they are now underivable");
    }
}
