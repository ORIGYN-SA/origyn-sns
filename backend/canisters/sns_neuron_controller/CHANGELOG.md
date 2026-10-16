# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Versions

### [unreleased]

### [1.2.0] - 2026-10-13

#### Added
- **Neuron policy** : The daily job now enforces a following and maturity policy on every managed GOLDAO neuron: topic-based following of the hand-voted neuron `7eac04f2...` on all seven topics (legacy per-function following is cleared) and auto-stake maturity switched on. The two hand-configured neurons `85ba2947...` and `7eac04f2...` keep their following. The policy is stored in state, initialised to the production default on upgrade, changeable through `update_goldao_config` and visible in `get_config` and the metrics together with the last enforcement report.
- **Exclusive control** : With `exclusive_control` set, the policy removes every principal other than the controller from the non-exempt neurons, so the DAO alone controls them. A permission the controller does not hold itself is never removed. The two exempt neurons keep their principals.
- **Topic following types** : `SetFollowing`, `Topic`, `FolloweesForTopic`, `Followee` and `Neuron.topic_followees` added to the SNS governance API types, so `manage_sns_neuron` proposals can set topic following.

#### Fixed
- **Neuron maturity** : Disbursement skips neurons the controller is not allowed to disburse instead of failing on them every day.

### [1.1.4] - 2026-09-08

#### Fixed
- **Neuron maturity** : Set minimum disbursable maturity threshold (11 GOLDAO) to prevent governance errors.

### [1.1.3] - 2026-08-25

#### Added
- **Neuron maturity** : Added neuron maturity disbursement with the following rewards sending to the rewards destination

### [1.1.2] - 2026-07-23

#### Fixed
- **Rewards transfer** : Decoupled the rewards transfer logic from the claim rewards result

### [1.1.1] - 2026-05-11

#### Added
- **OGY rewards destination** : Added the reward destination subaccount

### [1.1.0] - 2026-05-07

#### Added
- **New tokens support** : Added support of ICP, WTN, OGY tokens when claiming rewards from GOLDAO neurons

### [1.0.0] - 2026-03-23

#### Description

This release introduces the SNS Neuron Controller canister, responsible for managing and operating neurons across multiple systems (both SNS and NNS). The canister supports neuron lifecycle operations, reward handling, and configuration management, providing a unified interface for interacting with different neuron types.