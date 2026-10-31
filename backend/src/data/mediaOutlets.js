// Editorial classifications supplied in the owner's Media details sheet.
// Domains are proposed operational mappings; review them in the source library.
const categories = ['Progressive / Left', 'Center-Left', 'Center / Neutral', 'Center-Right', 'Right / Conservative'];
const rows = [
  ['The Intercept','theintercept.com',0,'USA'], ['Vox','vox.com',0,'USA'],
  ['The Guardian','theguardian.com',0,'UK'], ['Le Monde Diplomatique','mondediplo.com',0,'France'],
  ['The Washington Post','washingtonpost.com',1,'USA'], ['NPR','npr.org',1,'USA'], ['PBS','pbs.org',1,'USA'],
  ['The Economist','economist.com',1,'UK'], ['Der Spiegel','spiegel.de',1,'Germany'],
  ['BBC News','bbc.com,bbc.co.uk',1,'UK'], ['Al Jazeera English','aljazeera.com',1,'Qatar'],
  ['Reuters','reuters.com',2,'UK / USA'], ['Associated Press (AP)','apnews.com',2,'USA'],
  ['Agence France-Presse (AFP)','afp.com',2,'France'], ['Bloomberg News','bloomberg.com',2,'USA'],
  ['The Wall Street Journal','wsj.com',3,'USA'], ['The Times (London)','thetimes.com,thetimes.co.uk',3,'UK'],
  ['The Hill','thehill.com',3,'USA'], ['The Spectator','spectator.co.uk',3,'UK'],
  ['Financial Times','ft.com',3,'UK'], ['Nikkei Asia','asia.nikkei.com',3,'Japan'],
  ['Fox News','foxnews.com',4,'USA'], ['Sky News Australia','skynews.com.au',4,'Australia'],
  ['The Daily Telegraph','telegraph.co.uk',4,'UK'], ['The Washington Times','washingtontimes.com',4,'USA'],
  ['Breitbart News','breitbart.com',4,'USA'],
  ['The Wire','thewire.in',0,'India'], ['Scroll.in','scroll.in',0,'India'], ['Newsclick.in','newsclick.in',0,'India'],
  ['The Hindu','thehindu.com',1,'India'], ['Hindustan Times','hindustantimes.com',1,'India'],
  ['The Print','theprint.in',1,'India'], ['Reuters India','reuters.com',2,'India'],
  ['Press Trust of India (PTI)','ptinews.com',2,'India'], ['India Today','indiatoday.in',3,'India'],
  ['Times of India','timesofindia.indiatimes.com',3,'India'], ['Economic Times','economictimes.indiatimes.com',3,'India'],
  ['Mint','livemint.com',3,'India'], ['Republic TV','republicworld.com',4,'India'],
  ['Zee News','zeenews.india.com',4,'India'], ['OpIndia','opindia.com',4,'India']
];
const outlets = rows.map(([name, domains, category, country]) => ({
  name, domains: domains.split(','), category: categories[category], country,
  region: country === 'India' ? 'Indian' : 'International', access: 'unknown', enabled: true,
  notes: 'Category supplied by the editor. Confirm domains and access before use.'
}));
module.exports = { categories, outlets };
