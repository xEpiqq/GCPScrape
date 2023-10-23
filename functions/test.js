import { fetchDomainInfo } from 'domain-info-fetcher';

async function main() {
  const domainInfo = await fetchDomainInfo('finecoolwholeday.neverssl.com');
  
  if (domainInfo) {
    console.log('SSL Data:', domainInfo.sslData);
    console.log('Server Data:', domainInfo.serverData);
    console.log('DNS Data:', domainInfo.dnsData);
    console.log('HTTP Status:', domainInfo.httpStatus);
  } else {
    console.error('Error fetching domain information');
  }
}

main();