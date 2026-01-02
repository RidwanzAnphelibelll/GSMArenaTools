#!/usr/bin/env node

const axios = require('axios');
const crypto = require('crypto');
const cheerio = require('cheerio');

const decryptData = (iv, key, data) => {
    const keyBuffer = Buffer.from(key, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    const encryptedData = Buffer.from(data, 'base64');
    const decipher = crypto.createDecipheriv('aes-128-cbc', keyBuffer, ivBuffer);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
};

const searchPhones = async (searchQuery) => {
  try {
    const quickSearchUrl = `https://m.gsmarena.com/results.php3?sQuickSearch=yes&sName=${encodeURIComponent(searchQuery)}`;
    const quickResponse = await axios.get(quickSearchUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="107", "Not=A?Brand";v="24"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Windows"'
      }
    });

    let $ = cheerio.load(quickResponse.data);
    
    const phones = [];
    $('.general-menu ul li').each((i, el) => {
      const $link = $(el).find('a');
      const href = $link.attr('href');
      const name = $link.find('strong').text().trim().replace(/\n/g, ' ');
      const img = $link.find('img').attr('src');
      
      if (href && name) {
        phones.push({
          name: name,
          url: href,
          image: img
        });
      }
    });
    
    if (phones.length > 0) {
      return {
        success: true,
        results: phones
      };
    }

    const modelSearchUrl = `https://m.gsmarena.com/resl.php3?sSearch=${encodeURIComponent(searchQuery)}`;
    const modelResponse = await axios.get(modelSearchUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="107", "Not=A?Brand";v="24"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Windows"'
      }
    });

    $ = cheerio.load(modelResponse.data);
    let scriptContent = null;
    $('script').each((i, el) => {
      const html = $(el).html();
      if (html && html.includes('const KEY')) {
        scriptContent = html;
        return false;
      }
    });
    
    if (!scriptContent) {
      return {
        success: false,
        message: 'No results found!'
      };
    }
    
    const ivMatch = scriptContent.match(/const IV\s*=\s*"([^"]+)"/);
    const keyMatch = scriptContent.match(/const KEY\s*=\s*"([^"]+)"/);
    const dataMatch = scriptContent.match(/const DATA\s*=\s*"([^"]+)"/);
    
    if (!ivMatch || !keyMatch || !dataMatch) {
      return {
        success: false,
        message: 'No results found!'
      };
    }
    
    const IV = ivMatch[1];
    const KEY = keyMatch[1];
    const DATA = dataMatch[1];
    
    const decryptedHTML = decryptData(IV, KEY, DATA);
    const $decrypted = cheerio.load(decryptedHTML);
    
    const modelPhones = [];
    $decrypted('a').each((i, el) => {
      const href = $decrypted(el).attr('href');
      const name = $decrypted(el).text().trim();
      const img = $decrypted(el).find('img').attr('src');
      
      if (href && href.includes('.php') && name) {
        modelPhones.push({
          name: name,
          url: href,
          image: img || ''
        });
      }
    });
    
    if (modelPhones.length === 0 || modelPhones.length > 1) {
      return {
        success: false,
        message: 'No results found!'
      };
    }
    
    return {
      success: true,
      results: modelPhones
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Failed to search: ${error.message}`
    };
  }
};

const getFirstUrl = async (searchQuery) => {
  try {
    const quickSearchUrl = `https://m.gsmarena.com/results.php3?sQuickSearch=yes&sName=${encodeURIComponent(searchQuery)}`;
    const quickResponse = await axios.get(quickSearchUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="107", "Not=A?Brand";v="24"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Windows"'
      }
    });

    let $ = cheerio.load(quickResponse.data);
    const quickFirstLink = $('.general-menu ul li').first().find('a').attr('href');
    
    if (quickFirstLink) {
      return quickFirstLink;
    }

    const modelSearchUrl = `https://m.gsmarena.com/resl.php3?sSearch=${encodeURIComponent(searchQuery)}`;
    const modelResponse = await axios.get(modelSearchUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="107", "Not=A?Brand";v="24"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Windows"'
      }
    });

    $ = cheerio.load(modelResponse.data);
    let scriptContent = null;
    $('script').each((i, el) => {
      const html = $(el).html();
      if (html && html.includes('const KEY')) {
        scriptContent = html;
        return false;
      }
    });
    
    if (!scriptContent) {
      return null;
    }
    
    const ivMatch = scriptContent.match(/const IV\s*=\s*"([^"]+)"/);
    const keyMatch = scriptContent.match(/const KEY\s*=\s*"([^"]+)"/);
    const dataMatch = scriptContent.match(/const DATA\s*=\s*"([^"]+)"/);
    
    if (!ivMatch || !keyMatch || !dataMatch) {
      return null;
    }
    
    const IV = ivMatch[1];
    const KEY = keyMatch[1];
    const DATA = dataMatch[1];
    
    const decryptedHTML = decryptData(IV, KEY, DATA);
    const $decrypted = cheerio.load(decryptedHTML);
    
    const allUrls = [];
    $decrypted('a').each((i, el) => {
      const href = $decrypted(el).attr('href');
      if (href && href.includes('.php')) {
        allUrls.push(href);
      }
    });
    
    if (allUrls.length > 1) {
      return null;
    }
    
    const urlMatch = decryptedHTML.match(/href=["']?([^"'\s>]+\.php)/);
    
    if (urlMatch) {
      return urlMatch[1];
    }
    
    return null;
  } catch (error) {
    throw new Error(`Failed to get first URL: ${error.message}`);
  }
};

const getPhoneSpecs = async (searchQuery, isDirectUrl = false) => {
  try {
    let phoneUrl;
    
    if (isDirectUrl) {
      phoneUrl = `https://m.gsmarena.com/${searchQuery}`;
    } else {
      const firstResult = await getFirstUrl(searchQuery);
      
      if (!firstResult) {
        return {
          success: false,
          message: 'No results found!'
        };
      }
      
      phoneUrl = `https://m.gsmarena.com/${firstResult}`;
    }
    
    const response = await axios.get(phoneUrl, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        'sec-ch-ua': '"Chromium";v="107", "Not=A?Brand";v="24"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Windows"'
      }
    });

    const $ = cheerio.load(response.data);
    const name = $('h1.section.nobor').text().trim();
    const image = $('img[alt*="MORE PICTURES"]').attr('src');
    const specs = {};
    
    $('#specs-list table').each((i, table) => {
      const $table = $(table);
      const category = $table.find('th').first().text().trim();
      
      if (!category) return;
      
      const categorySpecs = {};
      
      $table.find('tr').each((j, row) => {
        const $row = $(row);
        const $ttl = $row.find('td.ttl a');
        const $nfo = $row.find('td.nfo');
        
        if ($ttl.length > 0 && $nfo.length > 0) {
          const label = $ttl.text().trim();
          const value = $nfo.text().trim();
          
          if (label && value) {
            categorySpecs[label] = value;
          }
        } else if ($row.find('td.ttl').text().trim() === '' && $nfo.length > 0) {
          const value = $nfo.text().trim();
          if (value && Object.keys(categorySpecs).length > 0) {
            const lastKey = Object.keys(categorySpecs).pop();
            categorySpecs[lastKey] = categorySpecs[lastKey] + '\n' + value;
          }
        }
      });
      
      if (Object.keys(categorySpecs).length > 0) {
        specs[category] = categorySpecs;
      }
    });

    const quickSpecs = {
      display: ($('[data-spec="displaysize-hl"]').text() + '" ' + $('[data-spec="displayres-hl"]').text()).trim(),
      camera: ($('[data-spec="camerapixels-hl"]').text() + 'MP').trim(),
      video: $('[data-spec="videopixels-hl"]').text().trim(),
      ram: ($('[data-spec="ramsize-hl"]').text() + 'GB RAM').trim(),
      chipset: $('[data-spec="chipset-hl"]').text().trim(),
      battery: ($('[data-spec="batsize-hl"]').text() + 'mAh').trim(),
      charging: $('[data-spec="battype-hl"]').text().trim(),
      released: $('[data-spec="released-hl"]').text().trim(),
      body: $('[data-spec="body-hl"]').text().trim(),
      os: $('[data-spec="os-hl"]').text().trim(),
      storage: $('[data-spec="storage-hl"]').text().trim()
    };

    return {
      success: true,
      url: phoneUrl,
      data: {
        name,
        image,
        quickSpecs,
        detailedSpecs: specs
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to fetch phone specs: ${error.message}`
    };
  }
};

module.exports = {
    searchPhones,
    getPhoneSpecs
};
