import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export const ChevronDownIcon = (props: IconProps) => (
  <svg
    width="8"
    height="8"
    viewBox="0 0 8 8"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M6.64 2.98328L4.46667 5.15661C4.21 5.41328 3.79 5.41328 3.53333 5.15661L1.36 2.98328"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChevronLeftIcon = (props: IconProps) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M10 12L6 8L10 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChevronRightIcon = (props: IconProps) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M6 4L10 8L6 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SearchIcon = (props: IconProps) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M7.66665 14.0007C11.1644 14.0007 14 11.1651 14 7.66732C14 4.16951 11.1644 1.33398 7.66665 1.33398C4.16884 1.33398 1.33331 4.16951 1.33331 7.66732C1.33331 11.1651 4.16884 14.0007 7.66665 14.0007Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.6666 14.6673L13.3333 13.334"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const StakeVoteIcon = (props: IconProps) => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M14.475 20.7001L16.89 22.5751C17.205 22.8901 17.91 23.04 18.375 23.04H21.345C22.275 23.04 23.295 22.335 23.535 21.405L25.41 15.72C25.8 14.625 25.095 13.695 23.925 13.695H20.805C20.34 13.695 19.95 13.305 20.025 12.765L20.415 10.275C20.565 9.56996 20.1 8.78994 19.395 8.56494C18.765 8.32494 17.985 8.63991 17.685 9.10491L14.49 13.86"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeMiterlimit="10"
    />
    <path
      d="M10.5 20.7002V13.0651C10.5 11.9701 10.965 11.5801 12.06 11.5801H12.84C13.935 11.5801 14.4 11.9701 14.4 13.0651V20.7002C14.4 21.7952 13.935 22.1852 12.84 22.1852H12.06C10.965 22.1852 10.5 21.7952 10.5 20.7002Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M27 28.2901H25.86C24.66 28.2901 23.52 28.7551 22.68 29.5951L20.115 32.1302C18.945 33.2852 17.04 33.2852 15.87 32.1302L13.305 29.5951C12.465 28.7551 11.31 28.2901 10.125 28.2901H9C6.51 28.2901 4.5 26.2951 4.5 23.8351V7.47009C4.5 5.01009 6.51 3.01514 9 3.01514H27C29.49 3.01514 31.5 5.01009 31.5 7.47009V23.8351C31.5 26.2801 29.49 28.2901 27 28.2901Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeMiterlimit="10"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const EarnRewardsIcon = (props: IconProps) => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M28.5 13.5C28.5 15.675 27.855 17.67 26.745 19.335C25.125 21.735 22.56 23.43 19.575 23.865C19.065 23.955 18.54 24 18 24C17.46 24 16.935 23.955 16.425 23.865C13.44 23.43 10.875 21.735 9.255 19.335C8.145 17.67 7.5 15.675 7.5 13.5C7.5 7.695 12.195 3 18 3C23.805 3 28.5 7.695 28.5 13.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M31.875 27.7051L29.4 28.2901C28.845 28.4251 28.41 28.8451 28.29 29.4001L27.765 31.6051C27.48 32.8051 25.95 33.1651 25.155 32.2201L18 24.0001L10.845 32.2351C10.05 33.1801 8.52 32.8201 8.235 31.6201L7.71 29.4151C7.575 28.8601 7.14 28.4251 6.6 28.3051L4.125 27.7201C2.985 27.4501 2.58 26.0251 3.405 25.2001L9.255 19.3501C10.875 21.7501 13.44 23.4451 16.425 23.8801C16.935 23.9701 17.46 24.0151 18 24.0151C18.54 24.0151 19.065 23.9701 19.575 23.8801C22.56 23.4451 25.125 21.7501 26.745 19.3501L32.595 25.2001C33.42 26.0101 33.015 27.4351 31.875 27.7051Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.87 8.97L19.755 10.74C19.875 10.98 20.19 11.22 20.475 11.265L22.08 11.535C23.1 11.7 23.34 12.45 22.605 13.185L21.36 14.43C21.15 14.64 21.03 15.045 21.105 15.345L21.465 16.89C21.75 18.105 21.105 18.585 20.025 17.94L18.525 17.055C18.255 16.89 17.805 16.89 17.535 17.055L16.035 17.94C14.955 18.57 14.31 18.105 14.595 16.89L14.955 15.345C15.015 15.06 14.91 14.64 14.7 14.43L13.455 13.185C12.72 12.45 12.96 11.715 13.98 11.535L15.585 11.265C15.855 11.22 16.17 10.98 16.29 10.74L17.175 8.97C17.61 8.01 18.39 8.01 18.87 8.97Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const GovernCollectivelyIcon = (props: IconProps) => (
  <svg
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M23.085 7.815L25.2 12.045C25.485 12.63 26.25 13.185 26.895 13.305L30.72 13.935C33.165 14.34 33.735 16.11 31.98 17.88L28.995 20.865C28.5 21.36 28.215 22.335 28.38 23.04L29.235 26.73C29.91 29.64 28.35 30.78 25.785 29.25L22.2 27.12C21.555 26.73 20.475 26.73 19.83 27.12L16.245 29.25C13.68 30.765 12.12 29.64 12.795 26.73L13.65 23.04C13.815 22.35 13.53 21.375 13.035 20.865L10.05 17.88C8.29504 16.125 8.86503 14.355 11.31 13.935L15.135 13.305C15.78 13.2 16.545 12.63 16.83 12.045L18.945 7.815C20.07 5.52 21.93 5.52 23.085 7.815Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 7.5H3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7.5 28.5H3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4.5 18H3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CloseIcon = (props: IconProps) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M4 4L12 12M12 4L4 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CheckmarkCircleIcon = (props: IconProps) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M5.3 6.9L4.2125 5.8125C4.12083 5.72083 4.00833 5.675 3.875 5.675C3.74167 5.675 3.625 5.725 3.525 5.825C3.43333 5.91667 3.3875 6.03333 3.3875 6.175C3.3875 6.31667 3.43333 6.43333 3.525 6.525L4.95 7.95C5.04167 8.04167 5.15833 8.0875 5.3 8.0875C5.44167 8.0875 5.55833 8.04167 5.65 7.95L8.4875 5.1125C8.57917 5.02083 8.625 4.90833 8.625 4.775C8.625 4.64167 8.575 4.525 8.475 4.425C8.38333 4.33333 8.26667 4.2875 8.125 4.2875C7.98333 4.2875 7.86667 4.33333 7.775 4.425L5.3 6.9ZM6 11C5.30833 11 4.65833 10.8687 4.05 10.606C3.44167 10.3437 2.9125 9.9875 2.4625 9.5375C2.0125 9.0875 1.65633 8.55833 1.394 7.95C1.13133 7.34167 1 6.69167 1 6C1 5.30833 1.13133 4.65833 1.394 4.05C1.65633 3.44167 2.0125 2.9125 2.4625 2.4625C2.9125 2.0125 3.44167 1.65617 4.05 1.3935C4.65833 1.13117 5.30833 1 6 1C6.69167 1 7.34167 1.13117 7.95 1.3935C8.55833 1.65617 9.0875 2.0125 9.5375 2.4625C9.9875 2.9125 10.3437 3.44167 10.606 4.05C10.8687 4.65833 11 5.30833 11 6C11 6.69167 10.8687 7.34167 10.606 7.95C10.3437 8.55833 9.9875 9.0875 9.5375 9.5375C9.0875 9.9875 8.55833 10.3437 7.95 10.606C7.34167 10.8687 6.69167 11 6 11Z"
      fill="currentColor"
    />
  </svg>
);

export const BlockchainIcon = (props: IconProps) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      stroke="currentColor"
      strokeWidth="0.5"
      strokeMiterlimit="10"
      fill="none"
    >
      <path d="M8.74756 8.30664L11.2001 9.72414" />
      <path d="M11.2001 5.14844L8.74756 6.56594" />
      <path d="M7.24023 3.7168V5.6893" />
      <path d="M7.24023 9.18359V11.0436" />
      <path d="M11.2076 5.14852V3.90352L8.75506 2.48602V2.91352L7.24006 3.78352L5.72506 2.91352V2.47852L3.27256 3.89602V5.14852L2.18506 5.77852V9.10852L3.27256 9.73102V10.9685L5.72506 12.386V11.9135L7.24006 11.0435L8.75506 11.9135V12.371L11.2076 10.961V9.73102L12.2726 9.11602V5.76352L11.2076 5.14852Z" />
      <path d="M5.72478 8.30664L3.27979 9.72414" />
      <path d="M3.1377 5.06641L5.7252 6.55891" />
      <path d="M8.7551 11.9149L7.2401 11.0449L5.7251 11.9149V13.6699L7.2401 14.5399L8.7551 13.6699V11.9149Z" />
      <path d="M8.7551 11.9141L7.2401 12.7916L5.7251 11.9141" />
      <path d="M7.24023 14.5385V12.791" />
      <path d="M3.2725 3.40125L1.765 2.53125L0.25 3.40125V5.14875L1.765 6.02625L3.2725 5.14875V3.40125Z" />
      <path d="M3.2725 3.40234L1.765 4.27984L0.25 3.40234" />
      <path d="M1.76514 6.0268V4.2793" />
      <path d="M11.2075 3.40125L12.715 2.53125L14.23 3.40125V5.14875L12.715 6.02625L11.2075 5.14875V3.40125Z" />
      <path d="M11.2075 3.40234L12.715 4.27984L14.23 3.40234" />
      <path d="M12.7148 6.0268V4.2793" />
      <path d="M3.2725 9.73133L1.765 8.86133L0.25 9.73133V11.4788L1.765 12.3563L3.2725 11.4788V9.73133Z" />
      <path d="M3.2725 9.73242L1.765 10.6099L0.25 9.73242" />
      <path d="M1.76514 12.3569V10.6094" />
      <path d="M11.2075 9.73133L12.715 8.86133L14.23 9.73133V11.4788L12.715 12.3563L11.2075 11.4788V9.73133Z" />
      <path d="M11.2075 9.73242L12.715 10.6099L14.23 9.73242" />
      <path d="M12.7148 12.3569V10.6094" />
      <path d="M8.7551 1.16656L7.2401 0.289062L5.7251 1.16656V2.91406L7.2401 3.78406L8.7551 2.91406V1.16656Z" />
      <path d="M8.7551 1.16602L7.2401 2.03602L5.7251 1.16602" />
      <path d="M7.24023 3.78461V2.03711" />
      <path d="M8.7551 6.56695L7.2401 5.68945L5.7251 6.56695V8.31445L7.2401 9.18445L8.7551 8.31445V6.56695Z" />
      <path d="M8.7551 6.56641L7.2401 7.43641L5.7251 6.56641" />
      <path d="M7.24023 9.185V7.4375" />
    </g>
  </svg>
);

export const FilterIcon = (props: IconProps) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M4.5 7.25H19.5M7.385 12H16.615M10.27 16.75H13.73"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
