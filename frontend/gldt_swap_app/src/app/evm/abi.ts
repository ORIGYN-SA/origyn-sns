// The bridge functions, events and errors of the GLDT token (origyn-sns evm/gldt-bridge, GLDT.sol),
// taken from its compiled ABI. Ordinary ERC-20 calls use viem's erc20Abi.
export const gldtBridgeAbi = [
  {
    type: "function",
    name: "burnToIcp",
    inputs: [
      {
        name: "amount",
        type: "uint256"
      },
      {
        name: "icpPrincipal",
        type: "bytes32"
      },
      {
        name: "icpSubaccount",
        type: "bytes32"
      }
    ],
    outputs: [
      {
        name: "burnId",
        type: "uint64"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "claimFromIcp",
    inputs: [
      {
        name: "icpBurnIndex",
        type: "uint64"
      },
      {
        name: "recipient",
        type: "address"
      },
      {
        name: "amount",
        type: "uint256"
      },
      {
        name: "signature",
        type: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "isClaimed",
    inputs: [
      {
        name: "icpBurnIndex",
        type: "uint64"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "minBurnToIcp",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "paused",
    inputs: [],
    outputs: [
      {
        name: "lzPaused",
        type: "bool"
      },
      {
        name: "icpBridgePaused",
        type: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "quoteSend",
    inputs: [
      {
        name: "_sendParam",
        type: "tuple",
        components: [
          {
            name: "dstEid",
            type: "uint32"
          },
          {
            name: "to",
            type: "bytes32"
          },
          {
            name: "amountLD",
            type: "uint256"
          },
          {
            name: "minAmountLD",
            type: "uint256"
          },
          {
            name: "extraOptions",
            type: "bytes"
          },
          {
            name: "composeMsg",
            type: "bytes"
          },
          {
            name: "oftCmd",
            type: "bytes"
          }
        ]
      },
      {
        name: "_payInLzToken",
        type: "bool"
      }
    ],
    outputs: [
      {
        name: "msgFee",
        type: "tuple",
        components: [
          {
            name: "nativeFee",
            type: "uint256"
          },
          {
            name: "lzTokenFee",
            type: "uint256"
          }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "send",
    inputs: [
      {
        name: "_sendParam",
        type: "tuple",
        components: [
          {
            name: "dstEid",
            type: "uint32"
          },
          {
            name: "to",
            type: "bytes32"
          },
          {
            name: "amountLD",
            type: "uint256"
          },
          {
            name: "minAmountLD",
            type: "uint256"
          },
          {
            name: "extraOptions",
            type: "bytes"
          },
          {
            name: "composeMsg",
            type: "bytes"
          },
          {
            name: "oftCmd",
            type: "bytes"
          }
        ]
      },
      {
        name: "_fee",
        type: "tuple",
        components: [
          {
            name: "nativeFee",
            type: "uint256"
          },
          {
            name: "lzTokenFee",
            type: "uint256"
          }
        ]
      },
      {
        name: "_refundAddress",
        type: "address"
      }
    ],
    outputs: [
      {
        name: "msgReceipt",
        type: "tuple",
        components: [
          {
            name: "guid",
            type: "bytes32"
          },
          {
            name: "nonce",
            type: "uint64"
          },
          {
            name: "fee",
            type: "tuple",
            components: [
              {
                name: "nativeFee",
                type: "uint256"
              },
              {
                name: "lzTokenFee",
                type: "uint256"
              }
            ]
          }
        ]
      },
      {
        name: "oftReceipt",
        type: "tuple",
        components: [
          {
            name: "amountSentLD",
            type: "uint256"
          },
          {
            name: "amountReceivedLD",
            type: "uint256"
          }
        ]
      }
    ],
    stateMutability: "payable"
  },
  {
    type: "event",
    name: "BurnedToIcp",
    inputs: [
      {
        name: "burnId",
        type: "uint64",
        indexed: true
      },
      {
        name: "from",
        type: "address",
        indexed: true
      },
      {
        name: "icpPrincipal",
        type: "bytes32",
        indexed: false
      },
      {
        name: "icpSubaccount",
        type: "bytes32",
        indexed: false
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ClaimedFromIcp",
    inputs: [
      {
        name: "icpBurnIndex",
        type: "uint64",
        indexed: true
      },
      {
        name: "recipient",
        type: "address",
        indexed: true
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false
      }
    ],
    anonymous: false
  },
  {
    type: "error",
    name: "AlreadyClaimed",
    inputs: []
  },
  {
    type: "error",
    name: "BadIcpPrincipal",
    inputs: []
  },
  {
    type: "error",
    name: "BadSignature",
    inputs: []
  },
  {
    type: "error",
    name: "BelowMinimum",
    inputs: [
      {
        name: "min",
        type: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "PathPaused",
    inputs: []
  },
  {
    type: "error",
    name: "ZeroAddress",
    inputs: []
  }
] as const;
