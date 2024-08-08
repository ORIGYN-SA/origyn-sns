# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Versions

### [1.0.15] - 2024-08-8

#### Added

- Search in explorer view
- Search in graph transactions and improve UI/UX

#### Changed

- Ledger switch banner styles

### [1.0.14] - 2024-07-25

#### Added

- Select time period for Total OGY Suplly & Total OGY Burned Charts
- Active users count on Users Overview chart dashboard page

#### Fixed

- Total OGY burned data accuracy

### [1.0.13] - 2024-07-11

#### Fixed

- Authentication on Safari issue

### [1.0.12] - 2024-07-10

#### Added

- My account page link to navbar

### [1.0.11] - 2024-07-10

#### Changed

- Authentication system, solve some issues with Plug wallet

### [1.0.10] - 2024-06-27

#### Fixed

- OGY network revenue value on page dashboard

### [1.0.9] - 2024-06-20

#### Changed

- Precision for long numbers converted to human readable strings (e.g. charts axis, charts tooltips)

#### Fixed

- Set full amount (not rounded one) of user OGY balance when click on max btn on transfer.
- Estimated rewards calculation on page Governance
- Users can no longer claim reward if reward value is 0

#### Added

- Unique OGY account holders chart on page Dashboard

### [1.0.8] - 2024-06-18

#### Added

- Disabling close dialog during swap tokens process
- Close icon to dialogs
- Disclaimer on OGY stake dialog when user are not connected with Internet Identity
- Transaction fees are now billed to source in transfer
- Button max for filling amount to transfer to user max balance
- Error message when transfer didn't succeed
- Improve UI on dialog transfer success/error
- OGY reward pool chart on dashboard page
- Date uniformization, use UTC zone and display time elapsed
- Tokens in staking chart on Governance/Dashboard page
- Current balance account on chart on account details page

#### Changed

- headlessui package to version 2

#### Fixed

- Balance amount format in account overview
- Inacurate data in balance history chart on account details page
- Display subaccount only if exists on account details page

### [1.0.7] - 2024-06-12

#### Fix

- Inacurate OGY and ICP treasury account data

#### Added

- Proposals metrics on Governance page.

### [1.0.6] - 2024-06-11

#### Fix

- Improve display footer notice.
- Transactions table accounts columns display.
- Inacurate OGY treasury account

#### Added

- How to swap link on account page.
- Transaction history page for all accounts and user account.
- Transaction type in table transactions and transaction details.
- Clickable account in table token distribution on Home page.
- NNS Proposal link to chart's tooltip OGY circulation state on page dashboard.

### [1.0.5] - 2024-06-10

#### Fix

- Inacurate data for chart OGY foundation reserve on Home page.
- Inacurate data for estimated rewards on Gorvenance page.
- Improve display of neuron's data on Neuron table and Neuron details page.
- Description not sended on contact support form.

### [1.0.3] - 2024-06-07

#### Added

- Transaction hash compatibility for transactions details page.

#### Fix

- Display formatted value on page account for available OGY.
- Responsivity and data accuracy for estimated rewards on Governance page.
- Innacurate data for total OGY Burned on Home page chart.

### [1.0.2] - 2024-06-06

#### Added

- Disclaimer to prevent users refreshing page during the tokens swapping process

### [1.0.1] - 2024-06-06

#### Fix

- Fix API path for OGY price in prod, stag and dev

### [1.0.0] - 2024-06-05

#### Added

- Viewing OGY supply data.
- Tracking governance statistics.
- Exploring transactions.
- Viewing proposals.
- Swapping legacy OGY tokens to the new SNS OGY tokens.
- Transferring OGY tokens.
- Adding, reading, and deleting neurons.
- Claiming rewards.
- Recovering tokens via a dedicated recovery page.
