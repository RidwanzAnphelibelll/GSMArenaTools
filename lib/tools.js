#!/usr/bin/env node

const axios = require('axios');
const cheerio = require('cheerio');

const generateCookies = () => {
    const timestamp = Date.now();
    return {
        'lpe': '128',
        '_ga': `GA1.1.${Math.random().toString().slice(2, 14)}.${timestamp}`,
        'unic_uspnatv1_set': '1',
        'unic_uspnatv1': 'BVQAAAAAAEA.QA'
    };
};

const detectDevice = async (userAgent) => {
    try {
        const modelMatch = userAgent.match(/;\s*([^;)]+)\s*\)/);
        let model = modelMatch ? modelMatch[1].trim() : '';
        
        if (!model || model.includes('Build/') || model === 'Android') {
            const buildMatch = userAgent.match(/Build\/([^;)]+)/);
            if (buildMatch) {
                model = buildMatch[1].trim();
            }
        }
        
        if (!model || model.length < 3) {
            return {
                success: false,
                message: 'Could not detect device model from User Agent'
            };
        }

        const cookies = generateCookies();
        const cookieString = Object.entries(cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');

        const response = await axios.get(`https://m.gsmarena.com/resl.php3?sSearch=${encodeURIComponent(model)}`, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Cookie': cookieString,
                'Referer': 'https://m.gsmarena.com/',
                'User-Agent': userAgent || 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const devices = [];

        $('.makers ul li').each((i, elem) => {
            const link = $(elem).find('a');
            const img = $(elem).find('img');
            const name = link.find('span').first().text().trim();
            const url = link.attr('href');
            const image = img.attr('src');
            
            if (name && url) {
                devices.push({
                    name: name,
                    url: url,
                    image: image || 'https://fdn2.gsmarena.com/vv/bigpic/default.jpg'
                });
            }
        });

        if (devices.length === 0) {
            return {
                success: false,
                message: `No device found for model: ${model}`
            };
        }

        return {
            success: true,
            detectedModel: model,
            devices: devices,
            cookies: cookies
        };

    } catch (error) {
        return {
            success: false,
            message: `${error.message}`
        };
    }
};

const getDeviceInfo = async (url, userAgent) => {
    try {
        const fullUrl = url.startsWith('http') ? url : `https://m.gsmarena.com/${url}`;
        
        const cookies = generateCookies();
        const cookieString = Object.entries(cookies)
            .map(([key, value]) => `${key}=${value}`)
            .join('; ');

        const response = await axios.get(fullUrl, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Cookie': cookieString,
                'Referer': 'https://m.gsmarena.com/',
                'User-Agent': userAgent || 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        
        const deviceInfo = {
            name: $('h1.section').text().trim(),
            subtitle: $('.sub-h1').text().trim(),
            image: $('.specs-cp-pic-rating img').attr('src'),
            quickSpecs: {},
            specs: {}
        };

        $('.quick-specs.vote li').each((i, elem) => {
            const $elem = $(elem);
            const strong = $elem.find('strong').text().trim();
            const span = $elem.find('span').first().text().trim();
            
            if (strong || span) {
                const key = `spec_${i + 1}`;
                deviceInfo.quickSpecs[key] = {
                    value: strong,
                    detail: span
                };
            }
        });

        $('.specs-brief-accent').each((i, elem) => {
            const $elem = $(elem);
            const text = $elem.text().trim();
            if (text) {
                deviceInfo.quickSpecs[`brief_${i + 1}`] = text;
            }
        });

        $('#specs-list table').each((i, table) => {
            const $table = $(table);
            const category = $table.find('th').first().text().trim();
            const specs = {};
            
            $table.find('tr').each((j, row) => {
                const $row = $(row);
                if ($row.find('th').length > 0) return;
                
                const label = $row.find('.ttl').text().trim();
                const value = $row.find('.nfo').text().trim();
                
                if (label && value) {
                    specs[label] = value;
                } else if (value && !label) {
                    const prevLabel = Object.keys(specs).pop();
                    if (prevLabel) {
                        specs[prevLabel] += ' ' + value;
                    }
                }
            });
            
            if (Object.keys(specs).length > 0 && category) {
                deviceInfo.specs[category] = specs;
            }
        });

        $('#popularity-vote').each((i, elem) => {
            const $elem = $(elem);
            deviceInfo.popularity = {
                percentage: $elem.find('strong').text().trim(),
                hits: $elem.text().replace($elem.find('strong').text(), '').trim()
            };
        });

        return {
            success: true,
            device: deviceInfo,
            cookies: cookies
        };

    } catch (error) {
        return {
            success: false,
            message: `${error.message}`
        };
    }
};

module.exports = {
    detectDevice,
    getDeviceInfo
};
