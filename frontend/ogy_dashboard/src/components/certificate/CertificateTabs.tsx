export type CertificateTab = string;

interface DynamicTab {
  id: string;
  label: string;
}

interface CertificateTabsProps {
  activeTab: CertificateTab;
  onTabChange: (tab: CertificateTab) => void;
  certificateTabLabel: string;
  /** Section tabs shown after the Certificate tab */
  dynamicTabs?: DynamicTab[];
}

// Events/Ledger tabs from the Minting Studio are omitted: the dashboard has no
// per-certificate blockchain-history source wired up yet.
const CertificateTabs = ({
  activeTab,
  onTabChange,
  certificateTabLabel,
  dynamicTabs = [],
}: CertificateTabsProps) => {
  const tabs: DynamicTab[] = [
    { id: "certificate", label: certificateTabLabel },
    ...dynamicTabs,
  ];

  return (
    <div className="flex w-full items-center justify-center gap-4 rounded-tl-[24px] rounded-tr-[24px] bg-[#222526] px-2 pt-6 pb-0 sm:gap-16 sm:px-16 sm:pt-10">
      <nav className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-[#434849] bg-[#2e3233] p-1 sm:gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center justify-center gap-2.5 rounded-full px-2 py-2 text-[10px] leading-[18px] font-medium tracking-[0.5px] whitespace-nowrap uppercase transition-colors sm:px-4 sm:py-4 sm:text-[14px] sm:leading-[23px] sm:tracking-[0.7px] ${
                isActive
                  ? "bg-[#fcfafa] text-[#061937]"
                  : "bg-transparent font-light text-[#e1e1e1] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default CertificateTabs;
