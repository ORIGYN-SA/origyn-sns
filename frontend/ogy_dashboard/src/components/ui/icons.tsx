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
    <path d="M12 7.5H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.5 28.5H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4.5 18H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
