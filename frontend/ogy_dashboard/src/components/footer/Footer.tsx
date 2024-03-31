const Footer = () => {
  return (
    <footer className="bg-charcoal text-white p-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
        <div>
          <h2 className="text-xl font-bold text-green-400 mb-4">
            OGY Dashboard
          </h2>
          {/* Additional content or logo can go here */}
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3">OGY Dashboard</h3>
          <ul>
            <li>Home</li>
            <li>Circulation</li>
            <li>Governance</li>
            <li>Revenue</li>
            {/* ... other items */}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Learn more about OGY Tokenomics & ORIGYN
          </h3>
          <ul>
            <li>OGY Tokenomics Deck</li>
            <li>Tokenomics Litepaper</li>
            <li>ORIGYN NFT Standard</li>
            {/* ... other items */}
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3">Support</h3>
          <ul>
            <li>Twitter</li>
            <li>Telegram</li>
            <li>Medium</li>
            {/* ... other items */}
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
