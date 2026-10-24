window.INTERLOCK_TRACES = {
 "faults": {
  "happy_path": "no fault (control)",
  "crash_before_send": "in-flight marker durable, process dies before the request is sent",
  "crash_before_ack": "service commits the refund; process dies before the ack is recorded",
  "duplicate_submit": "the same approved request is submitted twice",
  "model_redecides": "after crash_before_ack the re-run model says $30 instead of $20",
  "conflicting_payload": "same approved request arrives with a different amount, no crash",
  "lease_revoked": "refund permission revoked after the decision, before it lands",
  "stale_eligibility": "order becomes ineligible after the decision, before it lands",
  "refund_during_outage": "crash before send; while the agent is down a human refunds the order by hand",
  "lease_revoked_during_outage": "crash before send; refund permission revoked before recovery",
  "key_expired": "crash before ack; recovery runs after the provider's 24h idempotency window"
 },
 "results": {
  "happy_path": {
   "naive": {
    "outcome": "APPLIED",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20"
   },
   "idempotency@tier1": {
    "outcome": "APPLIED:ok",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20"
   },
   "durable@tier1": {
    "outcome": "COMPLETED:ok",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20"
   },
   "gate@tier1": {
    "outcome": "COMMITTED",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879881.2420378,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "f6743448da13c62a7e89976b47709039c52ea0b98c6783b1a7d31453f776a55f"
     },
     {
      "ts": 1792879881.2711413,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "f6743448da13c62a7e89976b47709039c52ea0b98c6783b1a7d31453f776a55f",
      "hash": "f2d05be6d562bba95bbaac9054bcee14c90a69d773dee38a42a5b070cb251089"
     },
     {
      "ts": 1792879881.277237,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "f2d05be6d562bba95bbaac9054bcee14c90a69d773dee38a42a5b070cb251089",
      "hash": "c871a92b19131cdb7bf48e0fd740e8e75f5f67ba5510d24046dd918f7b801a4d"
     },
     {
      "ts": 1792879881.2882318,
      "kind": "COMMITTED",
      "effect_id": "6b6f07d3ceb0",
      "result": {
       "status": "ok"
      },
      "prev": "c871a92b19131cdb7bf48e0fd740e8e75f5f67ba5510d24046dd918f7b801a4d",
      "hash": "306b77273795e6afce3114959ce714d273bb84452c8bafdc52d736aedf6e8178"
     }
    ]
   },
   "gate@tier2": {
    "outcome": "COMMITTED",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879881.3022614,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "0c8764424838a9a1fe1ea49077f317bfae79222e5c62d22cd060eb295e28055c"
     },
     {
      "ts": 1792879881.3130565,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "0c8764424838a9a1fe1ea49077f317bfae79222e5c62d22cd060eb295e28055c",
      "hash": "040c46880179dae1a3781fb10b9634da744e020b606c2abb1aa267030c007302"
     },
     {
      "ts": 1792879881.3264496,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "040c46880179dae1a3781fb10b9634da744e020b606c2abb1aa267030c007302",
      "hash": "ac1e99343f869489efbe71ab22b4c7cc62558681273e8d9e6b55dc0ffa4fe226"
     },
     {
      "ts": 1792879881.340336,
      "kind": "COMMITTED",
      "effect_id": "6b6f07d3ceb0",
      "result": {
       "status": "ok"
      },
      "prev": "ac1e99343f869489efbe71ab22b4c7cc62558681273e8d9e6b55dc0ffa4fe226",
      "hash": "831b33a61fc5da89610fd4b839a395bf25ec6b1d03fb60c7fc272bb0a09ae19a"
     }
    ]
   },
   "gate@tier3": {
    "outcome": "COMMITTED",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879881.3562868,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "2afe13b0de729dc2fa246b6f62746fe17f767662d3eeddc15bb1298659302e20"
     },
     {
      "ts": 1792879881.3624258,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "2afe13b0de729dc2fa246b6f62746fe17f767662d3eeddc15bb1298659302e20",
      "hash": "5fdbd053045ba219b51d6ed708292c00f4cb19ff6db187d21c816e0122f83c60"
     },
     {
      "ts": 1792879881.36871,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "5fdbd053045ba219b51d6ed708292c00f4cb19ff6db187d21c816e0122f83c60",
      "hash": "b6c388dba96b51cb0420212fdcd4165f43879edb3460291097d5168241aae22c"
     },
     {
      "ts": 1792879881.3796394,
      "kind": "COMMITTED",
      "effect_id": "6b6f07d3ceb0",
      "result": {
       "status": "ok"
      },
      "prev": "b6c388dba96b51cb0420212fdcd4165f43879edb3460291097d5168241aae22c",
      "hash": "524dfeaff7ef3cd331f41ad56b8364b5064b47b08a3d552ba56e258c87763a0a"
     }
    ]
   }
  },
  "crash_before_send": {
   "naive": {
    "outcome": "RETRIED",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20"
   },
   "idempotency@tier1": {
    "outcome": "RETRIED",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20"
   },
   "durable@tier1": {
    "outcome": "RERUN:ok",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20"
   },
   "gate@tier1": {
    "outcome": "COMMITTED_BY_RETRY",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879881.392814,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "90c638014e192d82075cb474a23b132f6bb3fb12a002cf7f1b2469ac135e2648"
     },
     {
      "ts": 1792879881.3993843,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "90c638014e192d82075cb474a23b132f6bb3fb12a002cf7f1b2469ac135e2648",
      "hash": "8cacea614e5b5258b9670a5e19fade577e905018474d1dcecbeae1ab3ff0b970"
     },
     {
      "ts": 1792879881.4062884,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "8cacea614e5b5258b9670a5e19fade577e905018474d1dcecbeae1ab3ff0b970",
      "hash": "2d3167a945a0dd63b6c47298c4a116d771bd424327195300d6ad366b7898517d"
     },
     {
      "ts": 1792879881.438336,
      "kind": "COMMITTED",
      "effect_id": "6b6f07d3ceb0",
      "via": "retry-idempotent",
      "rechecked": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "result": {
       "status": "ok"
      },
      "prev": "2d3167a945a0dd63b6c47298c4a116d771bd424327195300d6ad366b7898517d",
      "hash": "9c2a91f6c2bc4c3ac90d812354778050f68db7275642943d8a1bcbba513c20ed"
     }
    ]
   },
   "gate@tier2": {
    "outcome": "REAPPLIED_AFTER_QUERY",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879881.4508731,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "a8d1453d8842f89301660bd0b20c32f932256a16b0ce8fd9b98bb871b0b32b40"
     },
     {
      "ts": 1792879881.4575326,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "a8d1453d8842f89301660bd0b20c32f932256a16b0ce8fd9b98bb871b0b32b40",
      "hash": "58ae062fd032042bc1d3dfec21266d567fab39916a33799fee24d9bfcabb4375"
     },
     {
      "ts": 1792879881.4638119,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "58ae062fd032042bc1d3dfec21266d567fab39916a33799fee24d9bfcabb4375",
      "hash": "1a82a47bf0d34d0735d5c084c4a22d0716a182c7cb06a51ff1791257ff320b6c"
     },
     {
      "ts": 1792879881.495525,
      "kind": "COMMITTED",
      "effect_id": "6b6f07d3ceb0",
      "via": "recovery-reapply",
      "rechecked": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "result": {
       "status": "ok"
      },
      "prev": "1a82a47bf0d34d0735d5c084c4a22d0716a182c7cb06a51ff1791257ff320b6c",
      "hash": "ea1437f5ab775a3cdf81db63bd52b15567632f99c08a8e9441cfac8d54e70e95"
     }
    ]
   },
   "gate@tier3": {
    "outcome": "AMBIGUOUS",
    "refunded": "$0",
    "invariant_held": true,
    "caveat": "liveness_lost",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879881.5097723,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "f315c448abd9fbd1b1e97b2a042decc5f9474a2c8ed4786a2d809461b0c30a89"
     },
     {
      "ts": 1792879881.5157707,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "f315c448abd9fbd1b1e97b2a042decc5f9474a2c8ed4786a2d809461b0c30a89",
      "hash": "cbe69ae2e999c6032f84600a355467b417b990791992e01895835a121493cbbb"
     },
     {
      "ts": 1792879881.524582,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "cbe69ae2e999c6032f84600a355467b417b990791992e01895835a121493cbbb",
      "hash": "4ac8f87c43b86093f6a1f7b5359296a6ebf058d28e40108f12e773465cf7a08a"
     },
     {
      "ts": 1792879881.5540571,
      "kind": "AMBIGUOUS",
      "effect_id": "6b6f07d3ceb0",
      "code": "ambiguous",
      "prev": "4ac8f87c43b86093f6a1f7b5359296a6ebf058d28e40108f12e773465cf7a08a",
      "hash": "b7c92442e568989f13deeda48356a9a517931db4a1cb03a15b32123891eae308"
     }
    ]
   }
  },
  "crash_before_ack": {
   "naive": {
    "outcome": "RETRIED",
    "refunded": "$40",
    "invariant_held": false,
    "caveat": "",
    "expected": "$20"
   },
   "idempotency@tier1": {
    "outcome": "RETRIED",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20"
   },
   "durable@tier1": {
    "outcome": "RERUN:already_processed",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20"
   },
   "gate@tier1": {
    "outcome": "COMMITTED_BY_RETRY",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879881.5705845,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "4b7652eef04d7255cb622e1c35ac1111aaf8880bd18ede7b50ddcf5d1de3252b"
     },
     {
      "ts": 1792879881.5775924,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "4b7652eef04d7255cb622e1c35ac1111aaf8880bd18ede7b50ddcf5d1de3252b",
      "hash": "be06d9305a5e8aa54d5e62a747a64154ef3e86ba679826c989efbbade68cf531"
     },
     {
      "ts": 1792879881.586389,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "be06d9305a5e8aa54d5e62a747a64154ef3e86ba679826c989efbbade68cf531",
      "hash": "8b84802f95ee6862bb6515b48b2ebb0478f493979335ed8157b712d51df0bea3"
     },
     {
      "ts": 1792879881.6210318,
      "kind": "COMMITTED",
      "effect_id": "6b6f07d3ceb0",
      "via": "retry-idempotent",
      "rechecked": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "result": {
       "status": "already_processed"
      },
      "prev": "8b84802f95ee6862bb6515b48b2ebb0478f493979335ed8157b712d51df0bea3",
      "hash": "9b930e0f2d4b982e1a43f08f1ea2149733acd78c4b4e10c1d7bb324c7be67704"
     }
    ]
   },
   "gate@tier2": {
    "outcome": "COMMITTED_ON_QUERY",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879881.6362293,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "9a41403953ba63b97613dd411fa5baa4aea2b753566d0c913e92fc55f5fc4deb"
     },
     {
      "ts": 1792879881.6423054,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "9a41403953ba63b97613dd411fa5baa4aea2b753566d0c913e92fc55f5fc4deb",
      "hash": "ae59ba558f157923225fb3cc9edbcf0505059ab34677a33155fa57fc902e3d21"
     },
     {
      "ts": 1792879881.6511657,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "ae59ba558f157923225fb3cc9edbcf0505059ab34677a33155fa57fc902e3d21",
      "hash": "0b9ba8810db2a7ce7a6e634745c7b5b0edd2982d8dd323fca58cb11fd977acb4"
     },
     {
      "ts": 1792879881.6862435,
      "kind": "COMMITTED",
      "effect_id": "6b6f07d3ceb0",
      "via": "recovery-query",
      "rechecked": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "found": true,
      "prev": "0b9ba8810db2a7ce7a6e634745c7b5b0edd2982d8dd323fca58cb11fd977acb4",
      "hash": "ac4a42ad8a0efabebb6cf9db974708b0d5ec4a40da7f66c03412b3f12f2b296c"
     }
    ]
   },
   "gate@tier3": {
    "outcome": "AMBIGUOUS",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "liveness_lost",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879881.7035944,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "ae622c42658517dfde3aab18baf1afb39cfe0f4fdee80ecc8aebad352679c97b"
     },
     {
      "ts": 1792879881.7135217,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "ae622c42658517dfde3aab18baf1afb39cfe0f4fdee80ecc8aebad352679c97b",
      "hash": "067bf2b22581fd4595c5380a752edc8b2713ecc6e0adc7a97eb32f6a9e211c83"
     },
     {
      "ts": 1792879881.7217042,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "067bf2b22581fd4595c5380a752edc8b2713ecc6e0adc7a97eb32f6a9e211c83",
      "hash": "2bf7177ce9c5cf04171a6d46ecf1139fcbc2734d9dfc11e8e79ae623d3f62d20"
     },
     {
      "ts": 1792879881.7472005,
      "kind": "AMBIGUOUS",
      "effect_id": "6b6f07d3ceb0",
      "code": "ambiguous",
      "prev": "2bf7177ce9c5cf04171a6d46ecf1139fcbc2734d9dfc11e8e79ae623d3f62d20",
      "hash": "9efffa9817b64dc04233e084689a1908c1db0a60fcf720a85d518060647c5d46"
     }
    ]
   }
  },
  "duplicate_submit": {
   "naive": {
    "outcome": "APPLIED",
    "refunded": "$40",
    "invariant_held": false,
    "caveat": "",
    "expected": "$20"
   },
   "idempotency@tier1": {
    "outcome": "APPLIED:already_processed",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20"
   },
   "durable@tier1": {
    "outcome": "REPLAYED:ok",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20"
   },
   "gate@tier1": {
    "outcome": "DUPLICATE_IGNORED",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879881.761819,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "46f48328f6df7e628516f80bb2aec987b6a3f9adcc96099b3058ea332d128675"
     },
     {
      "ts": 1792879881.7684226,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "46f48328f6df7e628516f80bb2aec987b6a3f9adcc96099b3058ea332d128675",
      "hash": "0a9d02b34e9e3b53cd517cf43b55cf667f2a12f66a11708194c12740710ef91d"
     },
     {
      "ts": 1792879881.7770452,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "0a9d02b34e9e3b53cd517cf43b55cf667f2a12f66a11708194c12740710ef91d",
      "hash": "447fcdb7672ca0ac3d123b54c0886dbeff96be7f6f1e8435a3f9ec63f24076d9"
     },
     {
      "ts": 1792879881.787445,
      "kind": "COMMITTED",
      "effect_id": "6b6f07d3ceb0",
      "result": {
       "status": "ok"
      },
      "prev": "447fcdb7672ca0ac3d123b54c0886dbeff96be7f6f1e8435a3f9ec63f24076d9",
      "hash": "d1ee1627aa04a0b2f22d81384aa4bfdb04b0c3d290c958f1714e20be00592d10"
     }
    ]
   },
   "gate@tier2": {
    "outcome": "DUPLICATE_IGNORED",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879881.8064315,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "a21fc8d21f617b8725d065875495cdcb1a4db985450b8e09812a87920fca3e0c"
     },
     {
      "ts": 1792879881.814516,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "a21fc8d21f617b8725d065875495cdcb1a4db985450b8e09812a87920fca3e0c",
      "hash": "9e281e0124dab3e8dfa931c4982d9f09bef93f47ee991d1f360189b2acb31b71"
     },
     {
      "ts": 1792879881.81953,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "9e281e0124dab3e8dfa931c4982d9f09bef93f47ee991d1f360189b2acb31b71",
      "hash": "6bb1a35681b6f59d30bfc2afbfe353513187ac4314fc71aafaad63303a083285"
     },
     {
      "ts": 1792879881.8314154,
      "kind": "COMMITTED",
      "effect_id": "6b6f07d3ceb0",
      "result": {
       "status": "ok"
      },
      "prev": "6bb1a35681b6f59d30bfc2afbfe353513187ac4314fc71aafaad63303a083285",
      "hash": "73d12895cade952b963032b9fd629e8b81d5e83c159fcd6857f61cd7e4813c53"
     }
    ]
   },
   "gate@tier3": {
    "outcome": "DUPLICATE_IGNORED",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879881.8465526,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "03c4db159baf0b20788e7531976ffdff62bb053411a0dd0c0c71f741dd5a4bf7"
     },
     {
      "ts": 1792879881.8666062,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "03c4db159baf0b20788e7531976ffdff62bb053411a0dd0c0c71f741dd5a4bf7",
      "hash": "e8e9babd0095d48d881f2c971dc7b19e046d73a466276108a59ab646ef45fa89"
     },
     {
      "ts": 1792879881.888762,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "e8e9babd0095d48d881f2c971dc7b19e046d73a466276108a59ab646ef45fa89",
      "hash": "607c54099fc0431eeeb19e157cd82f7ad35bb80d3f365822e2accc461f78ff08"
     },
     {
      "ts": 1792879881.9032798,
      "kind": "COMMITTED",
      "effect_id": "6b6f07d3ceb0",
      "result": {
       "status": "ok"
      },
      "prev": "607c54099fc0431eeeb19e157cd82f7ad35bb80d3f365822e2accc461f78ff08",
      "hash": "31047862e44d909320ec9e01cd42230e19791a6d5b6ed0f8ff059b499e02b797"
     }
    ]
   }
  },
  "model_redecides": {
   "naive": {
    "outcome": "APPLIED",
    "refunded": "$50",
    "invariant_held": false,
    "caveat": "",
    "expected": "$20"
   },
   "idempotency@tier1": {
    "outcome": "APPLIED:key_reused_with_different_params",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20"
   },
   "durable@tier1": {
    "outcome": "REPLAYED:RERUN:already_processed",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20"
   },
   "gate@tier1": {
    "outcome": "REFUSED:conflicting_payload",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879881.9149249,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "7df1ff862d992cc4631ac8faf4a27b686c7323b0a21bda9c283513f8cf0eba0e"
     },
     {
      "ts": 1792879881.9201589,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "7df1ff862d992cc4631ac8faf4a27b686c7323b0a21bda9c283513f8cf0eba0e",
      "hash": "073cdaf098af7544fdda4dd5b5269ff3f63f3f87d6198b9acc6b0415a0edc832"
     },
     {
      "ts": 1792879881.9274971,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "073cdaf098af7544fdda4dd5b5269ff3f63f3f87d6198b9acc6b0415a0edc832",
      "hash": "03394489c82d1c079f622947f6c9df0445eaaca0a72f8f863ccf057ada883286"
     },
     {
      "ts": 1792879881.9543822,
      "kind": "COMMITTED",
      "effect_id": "6b6f07d3ceb0",
      "via": "retry-idempotent",
      "rechecked": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "result": {
       "status": "already_processed"
      },
      "prev": "03394489c82d1c079f622947f6c9df0445eaaca0a72f8f863ccf057ada883286",
      "hash": "f8badb0517c8e3087a02344ae1fa6fe5d47f2ed1e307b305b292b6f62560d9a5"
     },
     {
      "ts": 1792879881.9675798,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 20
      },
      "effect": {
       "order": "881",
       "amount": 30
      },
      "prev": "f8badb0517c8e3087a02344ae1fa6fe5d47f2ed1e307b305b292b6f62560d9a5",
      "hash": "04b3c359a74c01647f298919915658b4929e4d9f25eaf16f79126faacf0b5bdf"
     },
     {
      "ts": 1792879881.9746065,
      "kind": "REFUSED",
      "effect_id": "6b6f07d3ceb0",
      "code": "conflicting_payload",
      "reason": "payload differs from recorded decision",
      "recorded": {
       "order": "881",
       "amount": 20
      },
      "offered": {
       "order": "881",
       "amount": 30
      },
      "prev": "04b3c359a74c01647f298919915658b4929e4d9f25eaf16f79126faacf0b5bdf",
      "hash": "707045ab6f9068e6fa2462d3dbbd6aa290e2d82d6949ed2b65d8ba9dcf30707f"
     }
    ]
   },
   "gate@tier2": {
    "outcome": "REFUSED:conflicting_payload",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879882.0719228,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "6effb1eaf30f067b39f33d9f8d16871980bce00ab04e34c2ad3b92327331fcb3"
     },
     {
      "ts": 1792879882.1471074,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "6effb1eaf30f067b39f33d9f8d16871980bce00ab04e34c2ad3b92327331fcb3",
      "hash": "4fadcf2060001fb6dc1123953b94c18ee3c1657aae722285deda3b937626a42e"
     },
     {
      "ts": 1792879882.1525578,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "4fadcf2060001fb6dc1123953b94c18ee3c1657aae722285deda3b937626a42e",
      "hash": "181c96b5cdcf7efd1414db782e18f8dde3cbcf5c5cc893819719fa23715b7440"
     },
     {
      "ts": 1792879882.1765776,
      "kind": "COMMITTED",
      "effect_id": "6b6f07d3ceb0",
      "via": "recovery-query",
      "rechecked": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "found": true,
      "prev": "181c96b5cdcf7efd1414db782e18f8dde3cbcf5c5cc893819719fa23715b7440",
      "hash": "976a8840442646b9469d02da68b6beebaf1093966ae729256c2f9499f6deb18e"
     },
     {
      "ts": 1792879882.1884289,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 20
      },
      "effect": {
       "order": "881",
       "amount": 30
      },
      "prev": "976a8840442646b9469d02da68b6beebaf1093966ae729256c2f9499f6deb18e",
      "hash": "9748b5b839ad185c11e677e5188bb662c9db1ea712fbf0fb80281ff59850645d"
     },
     {
      "ts": 1792879882.1931577,
      "kind": "REFUSED",
      "effect_id": "6b6f07d3ceb0",
      "code": "conflicting_payload",
      "reason": "payload differs from recorded decision",
      "recorded": {
       "order": "881",
       "amount": 20
      },
      "offered": {
       "order": "881",
       "amount": 30
      },
      "prev": "9748b5b839ad185c11e677e5188bb662c9db1ea712fbf0fb80281ff59850645d",
      "hash": "45d5c5eb51c7fb9533e7f56d8230c5f339d0eaa364929822ee8dbdd7e1d7b06c"
     }
    ]
   },
   "gate@tier3": {
    "outcome": "REFUSED:conflicting_payload",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879882.1980603,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "4fce0c613429925d5ecef59988b4d3efa82838c6bee0d831e479027f77cfe8e8"
     },
     {
      "ts": 1792879882.203826,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "4fce0c613429925d5ecef59988b4d3efa82838c6bee0d831e479027f77cfe8e8",
      "hash": "198638786d86f71a15ff250a9157e9f9db7c15c57ae702270904ee2289cc50d4"
     },
     {
      "ts": 1792879882.210544,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "198638786d86f71a15ff250a9157e9f9db7c15c57ae702270904ee2289cc50d4",
      "hash": "25b0cf7a0b6934f84ddac222e2edbc43be311703955a344f63650e0eb1fadf96"
     },
     {
      "ts": 1792879882.241325,
      "kind": "AMBIGUOUS",
      "effect_id": "6b6f07d3ceb0",
      "code": "ambiguous",
      "prev": "25b0cf7a0b6934f84ddac222e2edbc43be311703955a344f63650e0eb1fadf96",
      "hash": "28d8cc6c886d5a66df1b0609b1435334104e0b3a1e968bea02eebe63821ccba0"
     },
     {
      "ts": 1792879882.2535741,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 20
      },
      "effect": {
       "order": "881",
       "amount": 30
      },
      "prev": "28d8cc6c886d5a66df1b0609b1435334104e0b3a1e968bea02eebe63821ccba0",
      "hash": "253f6d6bdac5f7b063fd5a5f0b2ef77a1a94140249bd27c53e4b309b50d0f74b"
     },
     {
      "ts": 1792879882.2586823,
      "kind": "REFUSED",
      "effect_id": "6b6f07d3ceb0",
      "code": "conflicting_payload",
      "reason": "payload differs from recorded decision",
      "recorded": {
       "order": "881",
       "amount": 20
      },
      "offered": {
       "order": "881",
       "amount": 30
      },
      "prev": "253f6d6bdac5f7b063fd5a5f0b2ef77a1a94140249bd27c53e4b309b50d0f74b",
      "hash": "911b12f9a999bdf4915ff02b421d365466412cedff5f69b78711b5c55b809266"
     }
    ]
   }
  },
  "conflicting_payload": {
   "naive": {
    "outcome": "APPLIED",
    "refunded": "$50",
    "invariant_held": false,
    "caveat": "",
    "expected": "$20"
   },
   "idempotency@tier1": {
    "outcome": "APPLIED:key_reused_with_different_params",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20"
   },
   "durable@tier1": {
    "outcome": "REPLAYED:ok",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20"
   },
   "gate@tier1": {
    "outcome": "REFUSED:conflicting_payload",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879882.26382,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "054602ce3426c0de6b19d65b378025b6104065cf360aed162f291caced62ca80"
     },
     {
      "ts": 1792879882.270469,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "054602ce3426c0de6b19d65b378025b6104065cf360aed162f291caced62ca80",
      "hash": "457be3639bb1b420c5392c9ed68959632a61d4bf9bd34a840186c5b5f03df8b3"
     },
     {
      "ts": 1792879882.277566,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "457be3639bb1b420c5392c9ed68959632a61d4bf9bd34a840186c5b5f03df8b3",
      "hash": "a6a3b8cad4356a11309cafc253730d8acb5c042fad1b7e501929bff4937d5505"
     },
     {
      "ts": 1792879882.2895083,
      "kind": "COMMITTED",
      "effect_id": "6b6f07d3ceb0",
      "result": {
       "status": "ok"
      },
      "prev": "a6a3b8cad4356a11309cafc253730d8acb5c042fad1b7e501929bff4937d5505",
      "hash": "eb508f606c88247bdc2adff9320eacc6f5d09dafd03b073cdd27b7ddbb53be76"
     },
     {
      "ts": 1792879882.3087566,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 20
      },
      "effect": {
       "order": "881",
       "amount": 30
      },
      "prev": "eb508f606c88247bdc2adff9320eacc6f5d09dafd03b073cdd27b7ddbb53be76",
      "hash": "289ba629b11da43618bf0782645d945259f9640e6d0044d23e1413607dde9c51"
     },
     {
      "ts": 1792879882.3152716,
      "kind": "REFUSED",
      "effect_id": "6b6f07d3ceb0",
      "code": "conflicting_payload",
      "reason": "payload differs from recorded decision",
      "recorded": {
       "order": "881",
       "amount": 20
      },
      "offered": {
       "order": "881",
       "amount": 30
      },
      "prev": "289ba629b11da43618bf0782645d945259f9640e6d0044d23e1413607dde9c51",
      "hash": "9d7a8a82b06f331e3ff56c6ef9b0ebaf56fdca33e97a537e665bec9ea10818b7"
     }
    ]
   },
   "gate@tier2": {
    "outcome": "REFUSED:conflicting_payload",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879882.3221335,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "655d21afb515d0d9093dcea87ea8fac77240e00208560ccba9a11e7459dfaec7"
     },
     {
      "ts": 1792879882.328067,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "655d21afb515d0d9093dcea87ea8fac77240e00208560ccba9a11e7459dfaec7",
      "hash": "5a25c6753849dc2654058a6c5d81c83c324c203906dcf1afbdf91df080dcc22e"
     },
     {
      "ts": 1792879882.3343391,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "5a25c6753849dc2654058a6c5d81c83c324c203906dcf1afbdf91df080dcc22e",
      "hash": "f7d4a7a1c86225a5a5fe98358d8eba2892f9f414fdbf0c5e43366a9d2c972da9"
     },
     {
      "ts": 1792879882.3425245,
      "kind": "COMMITTED",
      "effect_id": "6b6f07d3ceb0",
      "result": {
       "status": "ok"
      },
      "prev": "f7d4a7a1c86225a5a5fe98358d8eba2892f9f414fdbf0c5e43366a9d2c972da9",
      "hash": "8218421d749afd65a5ffaae1f4d3308181c6b6965116e698a383b553557c2824"
     },
     {
      "ts": 1792879882.3567245,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 20
      },
      "effect": {
       "order": "881",
       "amount": 30
      },
      "prev": "8218421d749afd65a5ffaae1f4d3308181c6b6965116e698a383b553557c2824",
      "hash": "7df44695a6d83757d57a53c8045ef81286afcb0e4ced5f70927bbbe27aba0ecd"
     },
     {
      "ts": 1792879882.3615873,
      "kind": "REFUSED",
      "effect_id": "6b6f07d3ceb0",
      "code": "conflicting_payload",
      "reason": "payload differs from recorded decision",
      "recorded": {
       "order": "881",
       "amount": 20
      },
      "offered": {
       "order": "881",
       "amount": 30
      },
      "prev": "7df44695a6d83757d57a53c8045ef81286afcb0e4ced5f70927bbbe27aba0ecd",
      "hash": "d3efcee3210e35cb738f471dcf32d44402260997cb21d2eb7036309ff87f7a77"
     }
    ]
   },
   "gate@tier3": {
    "outcome": "REFUSED:conflicting_payload",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879882.3663893,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "168e803bb8b965701b8c3f05b9753506e229bc10036a3db9d09f3e053f815a28"
     },
     {
      "ts": 1792879882.375519,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "168e803bb8b965701b8c3f05b9753506e229bc10036a3db9d09f3e053f815a28",
      "hash": "e83bfa3e931dba8cc3e52b0ca76e96c6feedb6f9d79c13014c0e0885fc4197dd"
     },
     {
      "ts": 1792879882.3851142,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "e83bfa3e931dba8cc3e52b0ca76e96c6feedb6f9d79c13014c0e0885fc4197dd",
      "hash": "59db146810910e3f8f4b335689fa564762228dda3eab5643315d8c04b1b3df4a"
     },
     {
      "ts": 1792879882.3934991,
      "kind": "COMMITTED",
      "effect_id": "6b6f07d3ceb0",
      "result": {
       "status": "ok"
      },
      "prev": "59db146810910e3f8f4b335689fa564762228dda3eab5643315d8c04b1b3df4a",
      "hash": "0a3b3c1e529306e80d3c6d3b447b2ec3957d01f9821522b0ff0b88f6bb4726b0"
     },
     {
      "ts": 1792879882.4038038,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 20
      },
      "effect": {
       "order": "881",
       "amount": 30
      },
      "prev": "0a3b3c1e529306e80d3c6d3b447b2ec3957d01f9821522b0ff0b88f6bb4726b0",
      "hash": "d1ff46da6d2d67e59667187b3be09946150acdf7bca27497b24331150ead4fdf"
     },
     {
      "ts": 1792879882.4097278,
      "kind": "REFUSED",
      "effect_id": "6b6f07d3ceb0",
      "code": "conflicting_payload",
      "reason": "payload differs from recorded decision",
      "recorded": {
       "order": "881",
       "amount": 20
      },
      "offered": {
       "order": "881",
       "amount": 30
      },
      "prev": "d1ff46da6d2d67e59667187b3be09946150acdf7bca27497b24331150ead4fdf",
      "hash": "b84c06210a07314959c30b52816f1d056723a3609352fdac7edcb1913ea2b63c"
     }
    ]
   }
  },
  "lease_revoked": {
   "naive": {
    "outcome": "APPLIED",
    "refunded": "$20",
    "invariant_held": false,
    "caveat": "",
    "expected": "$0"
   },
   "idempotency@tier1": {
    "outcome": "APPLIED:ok",
    "refunded": "$20",
    "invariant_held": false,
    "caveat": "",
    "expected": "$0"
   },
   "durable@tier1": {
    "outcome": "COMPLETED:ok",
    "refunded": "$20",
    "invariant_held": false,
    "caveat": "",
    "expected": "$0"
   },
   "gate@tier1": {
    "outcome": "REFUSED:lease",
    "refunded": "$0",
    "invariant_held": true,
    "caveat": "",
    "expected": "$0",
    "journal": [
     {
      "ts": 1792879882.4148495,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "f36f450701d156763e685661cd24d4ad5f6bf57420a882317392608d6bdd78a6"
     },
     {
      "ts": 1792879882.4201114,
      "kind": "REFUSED",
      "effect_id": "6b6f07d3ceb0",
      "code": "lease",
      "reason": "lease not live, or it does not cover this effect",
      "checks": {
       "lease_live": false,
       "lease": null
      },
      "prev": "f36f450701d156763e685661cd24d4ad5f6bf57420a882317392608d6bdd78a6",
      "hash": "82feea75317cdd4b4a700e902a537748cf65bf3361e13eb8a7171d257e8c73dd"
     }
    ]
   },
   "gate@tier2": {
    "outcome": "REFUSED:lease",
    "refunded": "$0",
    "invariant_held": true,
    "caveat": "",
    "expected": "$0",
    "journal": [
     {
      "ts": 1792879882.4262097,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "969d94e11f0d8c2624e9d4e2676217f7fd9550a498bcef93695dfbd4a3bc7f3b"
     },
     {
      "ts": 1792879882.4329898,
      "kind": "REFUSED",
      "effect_id": "6b6f07d3ceb0",
      "code": "lease",
      "reason": "lease not live, or it does not cover this effect",
      "checks": {
       "lease_live": false,
       "lease": null
      },
      "prev": "969d94e11f0d8c2624e9d4e2676217f7fd9550a498bcef93695dfbd4a3bc7f3b",
      "hash": "b1ef511378354b00edb397b7ea767bc0a931c2ef57205743c77d7cbf46b72bb0"
     }
    ]
   },
   "gate@tier3": {
    "outcome": "REFUSED:lease",
    "refunded": "$0",
    "invariant_held": true,
    "caveat": "",
    "expected": "$0",
    "journal": [
     {
      "ts": 1792879882.4384537,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "cd4f9d8c99a91fb4d7c0a948d5badd72128be178b178e083b50a84ff9695978c"
     },
     {
      "ts": 1792879882.4464936,
      "kind": "REFUSED",
      "effect_id": "6b6f07d3ceb0",
      "code": "lease",
      "reason": "lease not live, or it does not cover this effect",
      "checks": {
       "lease_live": false,
       "lease": null
      },
      "prev": "cd4f9d8c99a91fb4d7c0a948d5badd72128be178b178e083b50a84ff9695978c",
      "hash": "5c7e72125f19dbd303a2f7730959d21e54552382e1ac5471b885390115636618"
     }
    ]
   }
  },
  "stale_eligibility": {
   "naive": {
    "outcome": "APPLIED",
    "refunded": "$20",
    "invariant_held": false,
    "caveat": "",
    "expected": "$0"
   },
   "idempotency@tier1": {
    "outcome": "APPLIED:ok",
    "refunded": "$20",
    "invariant_held": false,
    "caveat": "",
    "expected": "$0"
   },
   "durable@tier1": {
    "outcome": "COMPLETED:ok",
    "refunded": "$20",
    "invariant_held": false,
    "caveat": "",
    "expected": "$0"
   },
   "gate@tier1": {
    "outcome": "REFUSED:stale_premise",
    "refunded": "$0",
    "invariant_held": true,
    "caveat": "",
    "expected": "$0",
    "journal": [
     {
      "ts": 1792879882.4519808,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "1f299ba4fc89b4e07f410e305da5e9747b9b7b2b84a6caedcce8429ccf60ae47"
     },
     {
      "ts": 1792879882.459936,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "1f299ba4fc89b4e07f410e305da5e9747b9b7b2b84a6caedcce8429ccf60ae47",
      "hash": "f8d006b61d11d70246cfade9a8d5b3694465e84dc0daeeb392903f0508934b91"
     },
     {
      "ts": 1792879882.4668014,
      "kind": "REFUSED",
      "effect_id": "6b6f07d3ceb0",
      "code": "stale_premise",
      "reason": [
       "eligibility changed"
      ],
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": [
        "eligibility changed"
       ]
      },
      "changes": [
       {
        "field": "eligible",
        "was": true,
        "now": false
       }
      ],
      "prev": "f8d006b61d11d70246cfade9a8d5b3694465e84dc0daeeb392903f0508934b91",
      "hash": "b0e85da721faad1c5cb38a8974385e753086362db274fd13a8dd34cd8eedad1d"
     }
    ]
   },
   "gate@tier2": {
    "outcome": "REFUSED:stale_premise",
    "refunded": "$0",
    "invariant_held": true,
    "caveat": "",
    "expected": "$0",
    "journal": [
     {
      "ts": 1792879882.4728837,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "5949723c8ad1f23dfd62437b26fe565630afa318967e48ae2aa934c497f49414"
     },
     {
      "ts": 1792879882.4781225,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "5949723c8ad1f23dfd62437b26fe565630afa318967e48ae2aa934c497f49414",
      "hash": "8bce2382dc81c990cb39c2d21936858e80c4bf7848d3d8fa65017fa5f7c28e84"
     },
     {
      "ts": 1792879882.4859087,
      "kind": "REFUSED",
      "effect_id": "6b6f07d3ceb0",
      "code": "stale_premise",
      "reason": [
       "eligibility changed"
      ],
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": [
        "eligibility changed"
       ]
      },
      "changes": [
       {
        "field": "eligible",
        "was": true,
        "now": false
       }
      ],
      "prev": "8bce2382dc81c990cb39c2d21936858e80c4bf7848d3d8fa65017fa5f7c28e84",
      "hash": "b5060d50e378b7ad66c649fe28efb8219128d81fccae8365ed9718705b6ed51f"
     }
    ]
   },
   "gate@tier3": {
    "outcome": "REFUSED:stale_premise",
    "refunded": "$0",
    "invariant_held": true,
    "caveat": "",
    "expected": "$0",
    "journal": [
     {
      "ts": 1792879882.492978,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "2828940ef8e2ec563bd40cbef8e6a7d6af9ddc5abf2aba554cb2096b23baea5a"
     },
     {
      "ts": 1792879882.5034702,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "2828940ef8e2ec563bd40cbef8e6a7d6af9ddc5abf2aba554cb2096b23baea5a",
      "hash": "fb31c05baeb60f5ab6ef72294db90dca9245f421f209c15163d9903ca446c883"
     },
     {
      "ts": 1792879882.5099237,
      "kind": "REFUSED",
      "effect_id": "6b6f07d3ceb0",
      "code": "stale_premise",
      "reason": [
       "eligibility changed"
      ],
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": [
        "eligibility changed"
       ]
      },
      "changes": [
       {
        "field": "eligible",
        "was": true,
        "now": false
       }
      ],
      "prev": "fb31c05baeb60f5ab6ef72294db90dca9245f421f209c15163d9903ca446c883",
      "hash": "e8cc7a261775c265a7d62bae3789a9c3402d4b56b6bc4f7e236794506d8d0d53"
     }
    ]
   }
  },
  "refund_during_outage": {
   "naive": {
    "outcome": "RETRIED",
    "refunded": "$40",
    "invariant_held": false,
    "caveat": "",
    "expected": "$20"
   },
   "idempotency@tier1": {
    "outcome": "RETRIED",
    "refunded": "$40",
    "invariant_held": false,
    "caveat": "",
    "expected": "$20"
   },
   "durable@tier1": {
    "outcome": "RERUN:ok",
    "refunded": "$40",
    "invariant_held": false,
    "caveat": "",
    "expected": "$20"
   },
   "gate@tier1": {
    "outcome": "REFUSED:stale_premise_at_recovery",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879882.516315,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "0516a8df523fe63b1f7ad6088f793360a28f39ed2fd298a140dd533a607394a5"
     },
     {
      "ts": 1792879882.5225732,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "0516a8df523fe63b1f7ad6088f793360a28f39ed2fd298a140dd533a607394a5",
      "hash": "7a99e4601bc18b90777c5ee7a6504472458803a9ba53a7f2b36e20b0f47860f1"
     },
     {
      "ts": 1792879882.5273943,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "7a99e4601bc18b90777c5ee7a6504472458803a9ba53a7f2b36e20b0f47860f1",
      "hash": "383dd1fe3541d33c579c0a1e0ad20ae49719a4f53313c5fe7d6e1dc2113f5b4f"
     },
     {
      "ts": 1792879882.5482996,
      "kind": "REFUSED",
      "effect_id": "6b6f07d3ceb0",
      "code": "stale_premise_at_recovery",
      "reason": "stale_premise at recovery",
      "resolves": true,
      "rechecked": {
       "lease_live": true,
       "lease": null,
       "violations": [
        "refunded elsewhere since decision"
       ]
      },
      "changes": [
       {
        "field": "refunded",
        "was": 0,
        "now": 20
       }
      ],
      "repairs": [
       {
        "code": "still_fits",
        "set": {},
        "why": "20 still fits: 80 of 100 is left to refund, if the other refund was not this one"
       }
      ],
      "prev": "383dd1fe3541d33c579c0a1e0ad20ae49719a4f53313c5fe7d6e1dc2113f5b4f",
      "hash": "e5faa48a2e688e81fa6a57f5991608361bb069ac09d28751a6af4d3e43f95c54"
     }
    ]
   },
   "gate@tier2": {
    "outcome": "REFUSED:stale_premise_at_recovery",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879882.5599942,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "39a2a67d4927bceb1fa5bd8fb428828f18f98005927e07764778ec07b438625a"
     },
     {
      "ts": 1792879882.5671241,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "39a2a67d4927bceb1fa5bd8fb428828f18f98005927e07764778ec07b438625a",
      "hash": "2639c79c5882f9b124b4f1078dbccb80c82c0ed1055d62a676b2d4b38e1eef09"
     },
     {
      "ts": 1792879882.5717053,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "2639c79c5882f9b124b4f1078dbccb80c82c0ed1055d62a676b2d4b38e1eef09",
      "hash": "cf5216636ff44afb7b85a9ce974dd5456a3ce1d89dc98113a6de7a5879859ab4"
     },
     {
      "ts": 1792879882.5935678,
      "kind": "REFUSED",
      "effect_id": "6b6f07d3ceb0",
      "code": "stale_premise_at_recovery",
      "reason": "stale_premise at recovery",
      "resolves": true,
      "rechecked": {
       "lease_live": true,
       "lease": null,
       "violations": [
        "refunded elsewhere since decision"
       ]
      },
      "changes": [
       {
        "field": "refunded",
        "was": 0,
        "now": 20
       }
      ],
      "repairs": [
       {
        "code": "still_fits",
        "set": {},
        "why": "20 still fits: 80 of 100 is left to refund, if the other refund was not this one"
       }
      ],
      "prev": "cf5216636ff44afb7b85a9ce974dd5456a3ce1d89dc98113a6de7a5879859ab4",
      "hash": "9c5ead265ace3ceb922e0d5032b6562a168e2a1baa5a8b5ee4cc1fcf687aefa3"
     }
    ]
   },
   "gate@tier3": {
    "outcome": "AMBIGUOUS",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "liveness_lost",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879882.6080363,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "744d0290836f71a6af234cf620fec7dbac029cafff7c98b5a582eaa3a8840ef2"
     },
     {
      "ts": 1792879882.6139643,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "744d0290836f71a6af234cf620fec7dbac029cafff7c98b5a582eaa3a8840ef2",
      "hash": "e76a2f836ae379b96537cec3542edda21428f085ac9a6fa20b29b2e0edb69732"
     },
     {
      "ts": 1792879882.61944,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "e76a2f836ae379b96537cec3542edda21428f085ac9a6fa20b29b2e0edb69732",
      "hash": "49ecb90ff9df8911bc8623471fcfcee4f3cc2763ec8294a9b903630e78a0f92f"
     },
     {
      "ts": 1792879882.64502,
      "kind": "AMBIGUOUS",
      "effect_id": "6b6f07d3ceb0",
      "code": "ambiguous",
      "prev": "49ecb90ff9df8911bc8623471fcfcee4f3cc2763ec8294a9b903630e78a0f92f",
      "hash": "ac03bc0d6b3fbf045b091ae534f6aaea1779147de6b3d478b3ef5567ff61e2fc"
     }
    ]
   }
  },
  "lease_revoked_during_outage": {
   "naive": {
    "outcome": "RETRIED",
    "refunded": "$20",
    "invariant_held": false,
    "caveat": "",
    "expected": "$0"
   },
   "idempotency@tier1": {
    "outcome": "RETRIED",
    "refunded": "$20",
    "invariant_held": false,
    "caveat": "",
    "expected": "$0"
   },
   "durable@tier1": {
    "outcome": "RERUN:ok",
    "refunded": "$20",
    "invariant_held": false,
    "caveat": "",
    "expected": "$0"
   },
   "gate@tier1": {
    "outcome": "REFUSED:lease_at_recovery",
    "refunded": "$0",
    "invariant_held": true,
    "caveat": "",
    "expected": "$0",
    "journal": [
     {
      "ts": 1792879882.6619003,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "2793f513fefd0b96d4b82aa4a537d4a077177295cd2e967f61fdb7995ee81ffb"
     },
     {
      "ts": 1792879882.6709716,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "2793f513fefd0b96d4b82aa4a537d4a077177295cd2e967f61fdb7995ee81ffb",
      "hash": "202d276a979cc56bfb7e1f60828581d5d0105b3320fe32140f801ec03d2fcd50"
     },
     {
      "ts": 1792879882.6772213,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "202d276a979cc56bfb7e1f60828581d5d0105b3320fe32140f801ec03d2fcd50",
      "hash": "d9944f1e3165178ac59af36a8083670d1ae621f9591fa5b35eb391b098399660"
     },
     {
      "ts": 1792879882.6965215,
      "kind": "REFUSED",
      "effect_id": "6b6f07d3ceb0",
      "code": "lease_at_recovery",
      "reason": "lease at recovery",
      "resolves": true,
      "rechecked": {
       "lease_live": false,
       "lease": null
      },
      "prev": "d9944f1e3165178ac59af36a8083670d1ae621f9591fa5b35eb391b098399660",
      "hash": "8035d064ddae952164d717eaedc69607fd17489781668d6432e835bf4b478285"
     }
    ]
   },
   "gate@tier2": {
    "outcome": "REFUSED:lease_at_recovery",
    "refunded": "$0",
    "invariant_held": true,
    "caveat": "",
    "expected": "$0",
    "journal": [
     {
      "ts": 1792879882.7127974,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "9a7b3ca6175d9f639399bbac0ed211ba295f926356989919ed3b3da54bfcb78c"
     },
     {
      "ts": 1792879882.7231302,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "9a7b3ca6175d9f639399bbac0ed211ba295f926356989919ed3b3da54bfcb78c",
      "hash": "5cac358ee27fc6e884a3ad5ec1486a1f2c46f281b1199e25300aa050dd5b619d"
     },
     {
      "ts": 1792879882.7280757,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "5cac358ee27fc6e884a3ad5ec1486a1f2c46f281b1199e25300aa050dd5b619d",
      "hash": "5f3908d4724404bfbebe3ebed4ccd04c3f1757da3ed4a22f6c956dce4e35e5e7"
     },
     {
      "ts": 1792879882.751675,
      "kind": "REFUSED",
      "effect_id": "6b6f07d3ceb0",
      "code": "lease_at_recovery",
      "reason": "lease at recovery",
      "resolves": true,
      "rechecked": {
       "lease_live": false,
       "lease": null
      },
      "prev": "5f3908d4724404bfbebe3ebed4ccd04c3f1757da3ed4a22f6c956dce4e35e5e7",
      "hash": "edc4cb0fc7104ba3c19915198d2bb847c6e22a4dda8c58e80d0ad4e5effc19fb"
     }
    ]
   },
   "gate@tier3": {
    "outcome": "AMBIGUOUS",
    "refunded": "$0",
    "invariant_held": true,
    "caveat": "liveness_lost",
    "expected": "$0",
    "journal": [
     {
      "ts": 1792879882.7699838,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "7bf8e52652fc3c5f64adfc0668a98bedb00f073a380fa48e7d3bfd485a74a763"
     },
     {
      "ts": 1792879882.7749722,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "7bf8e52652fc3c5f64adfc0668a98bedb00f073a380fa48e7d3bfd485a74a763",
      "hash": "5ce609fd6355a2291e104b28cc5690f09e25af9d58142ece04034ab9a171459a"
     },
     {
      "ts": 1792879882.781174,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "5ce609fd6355a2291e104b28cc5690f09e25af9d58142ece04034ab9a171459a",
      "hash": "3a622093ceedab3ef6d82ebb017ad90c33a7a78ac162a24d571068cbc10783cf"
     },
     {
      "ts": 1792879882.800624,
      "kind": "AMBIGUOUS",
      "effect_id": "6b6f07d3ceb0",
      "code": "ambiguous",
      "prev": "3a622093ceedab3ef6d82ebb017ad90c33a7a78ac162a24d571068cbc10783cf",
      "hash": "2f47614ce99cdabc240e38e105d6124319b2abdcbf3ad1182adeafe2e40878b9"
     }
    ]
   }
  },
  "key_expired": {
   "naive": {
    "outcome": "RETRIED",
    "refunded": "$40",
    "invariant_held": false,
    "caveat": "",
    "expected": "$20"
   },
   "idempotency@tier1": {
    "outcome": "RETRIED",
    "refunded": "$40",
    "invariant_held": false,
    "caveat": "",
    "expected": "$20"
   },
   "durable@tier1": {
    "outcome": "RERUN:ok",
    "refunded": "$40",
    "invariant_held": false,
    "caveat": "",
    "expected": "$20"
   },
   "gate@tier1": {
    "outcome": "COMMITTED_ON_QUERY",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879882.8121486,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "d964478e5b892c0a05b1f7d7586c1d3490e41872eed053f318824aecf533a844"
     },
     {
      "ts": 1792879882.8201542,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "d964478e5b892c0a05b1f7d7586c1d3490e41872eed053f318824aecf533a844",
      "hash": "47d7fef1ea0ba5c15976669ec2412db9194137046919a1b063b81e4dc0be04b9"
     },
     {
      "ts": 1792879882.828853,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "47d7fef1ea0ba5c15976669ec2412db9194137046919a1b063b81e4dc0be04b9",
      "hash": "0c62997caf925aaff1ab4268dde12f78d4139561e853055ee59db1581b18dc60"
     },
     {
      "ts": 1792879882.8543859,
      "kind": "COMMITTED",
      "effect_id": "6b6f07d3ceb0",
      "via": "recovery-query",
      "rechecked": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "found": true,
      "prev": "0c62997caf925aaff1ab4268dde12f78d4139561e853055ee59db1581b18dc60",
      "hash": "03b6391a39427fd54fd5631ddd8c25917ddb9511f7b48b01413cfa9103fc04b0"
     }
    ]
   },
   "gate@tier2": {
    "outcome": "COMMITTED_ON_QUERY",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879882.8718283,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "44df02866d8dad8a12628b3499b489a581979f82160a14f7ef600a056d62670b"
     },
     {
      "ts": 1792879882.8897588,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "44df02866d8dad8a12628b3499b489a581979f82160a14f7ef600a056d62670b",
      "hash": "180a3517d4370ab900e8d6f19c4fe16262bbbc5ac195cd6f1016cc84a6a0dc22"
     },
     {
      "ts": 1792879882.895951,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "180a3517d4370ab900e8d6f19c4fe16262bbbc5ac195cd6f1016cc84a6a0dc22",
      "hash": "bb89f37f55e8d2451b8620f340d71931c4ce4cb5b4c5b8d81ae8354c46adb601"
     },
     {
      "ts": 1792879882.91591,
      "kind": "COMMITTED",
      "effect_id": "6b6f07d3ceb0",
      "via": "recovery-query",
      "rechecked": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "found": true,
      "prev": "bb89f37f55e8d2451b8620f340d71931c4ce4cb5b4c5b8d81ae8354c46adb601",
      "hash": "ef42f5bcd1a0f0043965875264fe5e25bf2ac4c274b1a319111301fd7509c53b"
     }
    ]
   },
   "gate@tier3": {
    "outcome": "AMBIGUOUS",
    "refunded": "$20",
    "invariant_held": true,
    "caveat": "liveness_lost",
    "expected": "$20",
    "journal": [
     {
      "ts": 1792879882.9288545,
      "kind": "PROPOSED",
      "effect_id": "6b6f07d3ceb0",
      "agent": "refund-bot",
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "effect": {
       "order": "881",
       "amount": 20
      },
      "prev": null,
      "hash": "b5390f0375ae43b3b9627a664f0d615f8600c05a6d779363869bc108b608b50f"
     },
     {
      "ts": 1792879882.9374173,
      "kind": "AUTHORIZED",
      "effect_id": "6b6f07d3ceb0",
      "lease": "L-refund",
      "prev": "b5390f0375ae43b3b9627a664f0d615f8600c05a6d779363869bc108b608b50f",
      "hash": "91aca72cc3e966ada83c3fc42b4a5c3fe1720c9782ef828b04e1b9c19537a58e"
     },
     {
      "ts": 1792879882.9455462,
      "kind": "DISPATCHED",
      "effect_id": "6b6f07d3ceb0",
      "effect": {
       "order": "881",
       "amount": 20
      },
      "lease": "L-refund",
      "premises": {
       "order": "881",
       "eligible": true,
       "amount": 100,
       "refunded": 0
      },
      "checks": {
       "lease_live": true,
       "lease": null,
       "violations": []
      },
      "prev": "91aca72cc3e966ada83c3fc42b4a5c3fe1720c9782ef828b04e1b9c19537a58e",
      "hash": "b1183788809f6e9f71023ef0704a9b7b2b04d5791a11faba734bc0bb82d2ed10"
     },
     {
      "ts": 1792879882.9636617,
      "kind": "AMBIGUOUS",
      "effect_id": "6b6f07d3ceb0",
      "code": "ambiguous",
      "prev": "b1183788809f6e9f71023ef0704a9b7b2b04d5791a11faba734bc0bb82d2ed10",
      "hash": "e9e109ca17066c5a13f28ea987343ee211165cea0cd6b69d51f7aa3d0e9ab43a"
     }
    ]
   }
  }
 }
};
