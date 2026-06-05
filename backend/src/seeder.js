require('dotenv').config();
const mongoose = require('mongoose');
const Destination = require('./models/Destination');

const destinations = [
  {
    name: 'Lonavala', state: 'Maharashtra',
    description: 'Hill station famous for monsoon waterfalls and chikki',
    location: { type: 'Point', coordinates: [73.4062, 18.7546] },
    estimatedCostPerDay: 1200, transportCostFromNearestCity: 300,
    minDays: 1, recommendedDays: 2,
    tags: ['hills', 'nature', 'monsoon', 'waterfalls', 'trekking'],
    bestMonths: [6,7,8,9,10,11,12,1,2],
    nearestCity: 'Mumbai', nearestCityCoordinates: { lat: 19.0760, lng: 72.8777 },
    popularityScore: 9,
    transportOptions: { train: true, bus: true, flight: false, cab: true },
    attractions: ['Tiger Point', 'Bhushi Dam', 'Rajmachi Fort', 'Karla Caves', 'Lonavala Lake']
  },
  {
    name: 'Mahabaleshwar', state: 'Maharashtra',
    description: 'Strawberry capital of India with stunning valley views',
    location: { type: 'Point', coordinates: [73.6577, 17.9237] },
    estimatedCostPerDay: 1800, transportCostFromNearestCity: 500,
    minDays: 2, recommendedDays: 3,
    tags: ['hills', 'nature', 'strawberries', 'viewpoints', 'romantic'],
    bestMonths: [10,11,12,1,2,3,4,5],
    nearestCity: 'Mumbai', nearestCityCoordinates: { lat: 19.0760, lng: 72.8777 },
    popularityScore: 9,
    transportOptions: { train: false, bus: true, flight: false, cab: true },
    attractions: ['Venna Lake', 'Arthur Seat', 'Elephant Head Point', 'Mapro Garden', 'Wilson Point']
  },
  {
    name: 'Matheran', state: 'Maharashtra',
    description: 'Asia\'s only automobile-free hill station',
    location: { type: 'Point', coordinates: [73.2688, 18.9861] },
    estimatedCostPerDay: 1500, transportCostFromNearestCity: 400,
    minDays: 1, recommendedDays: 2,
    tags: ['hills', 'nature', 'peaceful', 'heritage', 'walking'],
    bestMonths: [10,11,12,1,2,3,4,5,6],
    nearestCity: 'Mumbai', nearestCityCoordinates: { lat: 19.0760, lng: 72.8777 },
    popularityScore: 8,
    transportOptions: { train: true, bus: false, flight: false, cab: false },
    attractions: ['Echo Point', 'Panorama Point', 'Charlotte Lake', 'Louisa Point', 'One Tree Hill']
  },
  {
    name: 'Alibaug', state: 'Maharashtra',
    description: 'Beach town with historic forts near Mumbai',
    location: { type: 'Point', coordinates: [72.8777, 18.6414] },
    estimatedCostPerDay: 2000, transportCostFromNearestCity: 600,
    minDays: 1, recommendedDays: 2,
    tags: ['beach', 'forts', 'water sports', 'seafood', 'relaxation'],
    bestMonths: [10,11,12,1,2,3],
    nearestCity: 'Mumbai', nearestCityCoordinates: { lat: 19.0760, lng: 72.8777 },
    popularityScore: 8,
    transportOptions: { train: false, bus: true, flight: false, cab: true },
    attractions: ['Alibaug Beach', 'Kolaba Fort', 'Kashid Beach', 'Kihim Beach', 'Murud Janjira']
  },
  {
    name: 'Shimla', state: 'Himachal Pradesh',
    description: 'Former British summer capital, queen of hill stations',
    location: { type: 'Point', coordinates: [77.1734, 31.1048] },
    estimatedCostPerDay: 2000, transportCostFromNearestCity: 800,
    minDays: 3, recommendedDays: 4,
    tags: ['hills', 'snow', 'heritage', 'colonial', 'nature', 'summer escape'],
    bestMonths: [3,4,5,6,9,10,11],
    nearestCity: 'Delhi', nearestCityCoordinates: { lat: 28.6139, lng: 77.2090 },
    popularityScore: 10,
    transportOptions: { train: true, bus: true, flight: false, cab: true },
    attractions: ['The Ridge', 'Mall Road', 'Jakhoo Temple', 'Kufri', 'Christ Church']
  },
  {
    name: 'Manali', state: 'Himachal Pradesh',
    description: 'Adventure capital of India with snow-capped peaks',
    location: { type: 'Point', coordinates: [77.1892, 32.2396] },
    estimatedCostPerDay: 2200, transportCostFromNearestCity: 1200,
    minDays: 4, recommendedDays: 6,
    tags: ['snow', 'adventure', 'trekking', 'mountains', 'camping', 'summer escape'],
    bestMonths: [3,4,5,6,9,10],
    nearestCity: 'Delhi', nearestCityCoordinates: { lat: 28.6139, lng: 77.2090 },
    popularityScore: 10,
    transportOptions: { train: false, bus: true, flight: false, cab: true },
    attractions: ['Rohtang Pass', 'Solang Valley', 'Hadimba Temple', 'Old Manali', 'Beas River']
  },
  {
    name: 'Dharamshala', state: 'Himachal Pradesh',
    description: 'Home of Dalai Lama, Tibetan culture meets Himalayan beauty',
    location: { type: 'Point', coordinates: [76.3234, 32.2190] },
    estimatedCostPerDay: 1500, transportCostFromNearestCity: 900,
    minDays: 3, recommendedDays: 4,
    tags: ['mountains', 'spiritual', 'culture', 'trekking', 'peaceful', 'summer escape'],
    bestMonths: [3,4,5,6,9,10,11],
    nearestCity: 'Delhi', nearestCityCoordinates: { lat: 28.6139, lng: 77.2090 },
    popularityScore: 9,
    transportOptions: { train: true, bus: true, flight: true, cab: true },
    attractions: ['McLeod Ganj', 'Namgyal Monastery', 'Bhagsu Waterfall', 'Triund Trek', 'Dal Lake']
  },
  {
    name: 'Nainital', state: 'Uttarakhand',
    description: 'Lake city nestled in Kumaon Hills',
    location: { type: 'Point', coordinates: [79.4614, 29.3919] },
    estimatedCostPerDay: 1800, transportCostFromNearestCity: 700,
    minDays: 2, recommendedDays: 3,
    tags: ['lake', 'hills', 'nature', 'boating', 'summer escape'],
    bestMonths: [3,4,5,6,9,10,11],
    nearestCity: 'Delhi', nearestCityCoordinates: { lat: 28.6139, lng: 77.2090 },
    popularityScore: 9,
    transportOptions: { train: true, bus: true, flight: false, cab: true },
    attractions: ['Naini Lake', 'Snow View Point', 'Naina Devi Temple', 'The Mall Road', 'Tiffin Top']
  },
  {
    name: 'Rishikesh', state: 'Uttarakhand',
    description: 'Yoga capital of the world, adventure sports hub',
    location: { type: 'Point', coordinates: [78.2676, 30.0869] },
    estimatedCostPerDay: 1200, transportCostFromNearestCity: 600,
    minDays: 2, recommendedDays: 3,
    tags: ['spiritual', 'adventure', 'yoga', 'rafting', 'trekking', 'nature'],
    bestMonths: [9,10,11,12,1,2,3,4,5,6],
    nearestCity: 'Delhi', nearestCityCoordinates: { lat: 28.6139, lng: 77.2090 },
    popularityScore: 10,
    transportOptions: { train: true, bus: true, flight: false, cab: true },
    attractions: ['Laxman Jhula', 'Ram Jhula', 'Triveni Ghat', 'Beatles Ashram', 'Bungee Jumping']
  },
  {
    name: 'Goa', state: 'Goa',
    description: 'India\'s beach paradise with Portuguese heritage',
    location: { type: 'Point', coordinates: [74.1240, 15.2993] },
    estimatedCostPerDay: 2500, transportCostFromNearestCity: 2000,
    minDays: 3, recommendedDays: 5,
    tags: ['beach', 'nightlife', 'water sports', 'heritage', 'seafood', 'party'],
    bestMonths: [10,11,12,1,2,3],
    nearestCity: 'Mumbai', nearestCityCoordinates: { lat: 19.0760, lng: 72.8777 },
    popularityScore: 10,
    transportOptions: { train: true, bus: true, flight: true, cab: true },
    attractions: ['Baga Beach', 'Calangute', 'Fort Aguada', 'Dudhsagar Falls', 'Old Goa Churches']
  },
  {
    name: 'Coorg', state: 'Karnataka',
    description: 'Scotland of India — coffee plantations and mist',
    location: { type: 'Point', coordinates: [75.7337, 12.3375] },
    estimatedCostPerDay: 2000, transportCostFromNearestCity: 800,
    minDays: 2, recommendedDays: 3,
    tags: ['nature', 'coffee', 'hills', 'trekking', 'waterfalls', 'peaceful'],
    bestMonths: [10,11,12,1,2,3,4,5],
    nearestCity: 'Bangalore', nearestCityCoordinates: { lat: 12.9716, lng: 77.5946 },
    popularityScore: 9,
    transportOptions: { train: false, bus: true, flight: false, cab: true },
    attractions: ['Abbey Falls', 'Raja\'s Seat', 'Namdroling Monastery', 'Talakaveri', 'Iruppu Falls']
  },
  {
    name: 'Mysore', state: 'Karnataka',
    description: 'City of palaces, incense, and silk',
    location: { type: 'Point', coordinates: [76.6394, 12.2958] },
    estimatedCostPerDay: 1500, transportCostFromNearestCity: 500,
    minDays: 2, recommendedDays: 2,
    tags: ['heritage', 'palaces', 'culture', 'silk', 'history'],
    bestMonths: [9,10,11,12,1,2,3,4,5,6],
    nearestCity: 'Bangalore', nearestCityCoordinates: { lat: 12.9716, lng: 77.5946 },
    popularityScore: 9,
    transportOptions: { train: true, bus: true, flight: false, cab: true },
    attractions: ['Mysore Palace', 'Chamundi Hills', 'Brindavan Gardens', 'Mysore Zoo', 'St. Philomena\'s Church']
  },
  {
    name: 'Hampi', state: 'Karnataka',
    description: 'UNESCO World Heritage ruins of Vijayanagara Empire',
    location: { type: 'Point', coordinates: [76.4600, 15.3350] },
    estimatedCostPerDay: 1200, transportCostFromNearestCity: 1000,
    minDays: 2, recommendedDays: 3,
    tags: ['heritage', 'ruins', 'history', 'photography', 'bouldering'],
    bestMonths: [10,11,12,1,2,3],
    nearestCity: 'Bangalore', nearestCityCoordinates: { lat: 12.9716, lng: 77.5946 },
    popularityScore: 8,
    transportOptions: { train: true, bus: true, flight: false, cab: true },
    attractions: ['Virupaksha Temple', 'Vittala Temple', 'Elephant Stables', 'Matanga Hill', 'Tungabhadra River']
  },
  {
    name: 'Ooty', state: 'Tamil Nadu',
    description: 'Queen of hill stations in the Nilgiris',
    location: { type: 'Point', coordinates: [76.6950, 11.4102] },
    estimatedCostPerDay: 1600, transportCostFromNearestCity: 700,
    minDays: 2, recommendedDays: 3,
    tags: ['hills', 'tea gardens', 'nature', 'toy train', 'peaceful'],
    bestMonths: [9,10,11,12,1,2,3,4,5,6],
    nearestCity: 'Bangalore', nearestCityCoordinates: { lat: 12.9716, lng: 77.5946 },
    popularityScore: 9,
    transportOptions: { train: true, bus: true, flight: false, cab: true },
    attractions: ['Ooty Lake', 'Botanical Gardens', 'Doddabetta Peak', 'Nilgiri Mountain Railway', 'Tea Museum']
  },
  {
    name: 'Munnar', state: 'Kerala',
    description: 'Tea capital of South India with misty mountain roads',
    location: { type: 'Point', coordinates: [77.0595, 10.0889] },
    estimatedCostPerDay: 2000, transportCostFromNearestCity: 1000,
    minDays: 2, recommendedDays: 3,
    tags: ['tea', 'hills', 'nature', 'romantic', 'honeymoon', 'peaceful'],
    bestMonths: [9,10,11,12,1,2,3,4,5,6],
    nearestCity: 'Kochi', nearestCityCoordinates: { lat: 9.9312, lng: 76.2673 },
    popularityScore: 9,
    transportOptions: { train: false, bus: true, flight: false, cab: true },
    attractions: ['Eravikulam National Park', 'Mattupetty Dam', 'Echo Point', 'Anamudi Peak', 'Tea Museum']
  },
  {
    name: 'Alleppey', state: 'Kerala',
    description: 'Venice of the East — backwaters and houseboats',
    location: { type: 'Point', coordinates: [76.3388, 9.4981] },
    estimatedCostPerDay: 2500, transportCostFromNearestCity: 800,
    minDays: 2, recommendedDays: 3,
    tags: ['backwaters', 'houseboat', 'nature', 'romantic', 'peaceful', 'unique'],
    bestMonths: [9,10,11,12,1,2,3,4,5],
    nearestCity: 'Kochi', nearestCityCoordinates: { lat: 9.9312, lng: 76.2673 },
    popularityScore: 9,
    transportOptions: { train: true, bus: true, flight: false, cab: true },
    attractions: ['Vembanad Lake', 'Alappuzha Beach', 'Houseboat Cruise', 'Marari Beach', 'Kuttanad Backwaters']
  },
  {
    name: 'Wayanad', state: 'Kerala',
    description: 'Green paradise with tribal culture and wildlife',
    location: { type: 'Point', coordinates: [76.1320, 11.6854] },
    estimatedCostPerDay: 1800, transportCostFromNearestCity: 900,
    minDays: 2, recommendedDays: 3,
    tags: ['nature', 'wildlife', 'trekking', 'tribal', 'forests', 'waterfalls'],
    bestMonths: [9,10,11,12,1,2,3,4,5,6],
    nearestCity: 'Bangalore', nearestCityCoordinates: { lat: 12.9716, lng: 77.5946 },
    popularityScore: 8,
    transportOptions: { train: false, bus: true, flight: false, cab: true },
    attractions: ['Edakkal Caves', 'Chembra Peak', 'Soochipara Falls', 'Banasura Sagar Dam', 'Muthanga Wildlife Sanctuary']
  },
  {
    name: 'Agra', state: 'Uttar Pradesh',
    description: 'Home of Taj Mahal — one of the seven wonders',
    location: { type: 'Point', coordinates: [78.0081, 27.1767] },
    estimatedCostPerDay: 1500, transportCostFromNearestCity: 500,
    minDays: 1, recommendedDays: 2,
    tags: ['heritage', 'history', 'architecture', 'UNESCO', 'photography'],
    bestMonths: [9,10,11,12,1,2,3],
    nearestCity: 'Delhi', nearestCityCoordinates: { lat: 28.6139, lng: 77.2090 },
    popularityScore: 10,
    transportOptions: { train: true, bus: true, flight: true, cab: true },
    attractions: ['Taj Mahal', 'Agra Fort', 'Fatehpur Sikri', 'Mehtab Bagh', 'Itmad-ud-Daulah']
  },
  {
    name: 'Jaipur', state: 'Rajasthan',
    description: 'Pink City — royal Rajput architecture and culture',
    location: { type: 'Point', coordinates: [75.7873, 26.9124] },
    estimatedCostPerDay: 1800, transportCostFromNearestCity: 600,
    minDays: 2, recommendedDays: 3,
    tags: ['heritage', 'palaces', 'culture', 'rajasthan', 'history', 'shopping'],
    bestMonths: [9,10,11,12,1,2,3],
    nearestCity: 'Delhi', nearestCityCoordinates: { lat: 28.6139, lng: 77.2090 },
    popularityScore: 10,
    transportOptions: { train: true, bus: true, flight: true, cab: true },
    attractions: ['Amber Fort', 'Hawa Mahal', 'City Palace', 'Jantar Mantar', 'Nahargarh Fort']
  },
  {
    name: 'Jodhpur', state: 'Rajasthan',
    description: 'Blue City with mighty Mehrangarh Fort',
    location: { type: 'Point', coordinates: [73.0243, 26.2389] },
    estimatedCostPerDay: 1500, transportCostFromNearestCity: 700,
    minDays: 1, recommendedDays: 2,
    tags: ['heritage', 'forts', 'desert', 'culture', 'photography', 'rajasthan'],
    bestMonths: [9,10,11,12,1,2,3],
    nearestCity: 'Delhi', nearestCityCoordinates: { lat: 28.6139, lng: 77.2090 },
    popularityScore: 8,
    transportOptions: { train: true, bus: true, flight: true, cab: true },
    attractions: ['Mehrangarh Fort', 'Jaswant Thada', 'Umaid Bhawan Palace', 'Clock Tower', 'Mandore Gardens']
  },
  {
    name: 'Udaipur', state: 'Rajasthan',
    description: 'City of Lakes — most romantic city in India',
    location: { type: 'Point', coordinates: [73.6967, 24.5854] },
    estimatedCostPerDay: 2000, transportCostFromNearestCity: 800,
    minDays: 2, recommendedDays: 3,
    tags: ['lakes', 'romance', 'heritage', 'palaces', 'rajasthan', 'honeymoon'],
    bestMonths: [9,10,11,12,1,2,3],
    nearestCity: 'Delhi', nearestCityCoordinates: { lat: 28.6139, lng: 77.2090 },
    popularityScore: 9,
    transportOptions: { train: true, bus: true, flight: true, cab: true },
    attractions: ['Lake Pichola', 'City Palace', 'Jag Mandir', 'Sajjangarh Palace', 'Saheliyon ki Bari']
  },
  {
    name: 'Pushkar', state: 'Rajasthan',
    description: 'Holy lake city with Brahma temple and camel fair',
    location: { type: 'Point', coordinates: [74.5552, 26.4899] },
    estimatedCostPerDay: 1200, transportCostFromNearestCity: 600,
    minDays: 1, recommendedDays: 2,
    tags: ['spiritual', 'culture', 'desert', 'photography', 'unique'],
    bestMonths: [9,10,11,12,1,2,3],
    nearestCity: 'Delhi', nearestCityCoordinates: { lat: 28.6139, lng: 77.2090 },
    popularityScore: 7,
    transportOptions: { train: false, bus: true, flight: false, cab: true },
    attractions: ['Pushkar Lake', 'Brahma Temple', 'Savitri Temple', 'Camel Safari', 'Pushkar Bazaar']
  },
  {
    name: 'Darjeeling', state: 'West Bengal',
    description: 'Tea city with stunning view of Kangchenjunga',
    location: { type: 'Point', coordinates: [88.2627, 27.0360] },
    estimatedCostPerDay: 1800, transportCostFromNearestCity: 1200,
    minDays: 2, recommendedDays: 3,
    tags: ['tea', 'mountains', 'hills', 'nature', 'toy train', 'peaceful'],
    bestMonths: [3,4,5,9,10,11,12],
    nearestCity: 'Kolkata', nearestCityCoordinates: { lat: 22.5726, lng: 88.3639 },
    popularityScore: 9,
    transportOptions: { train: true, bus: true, flight: true, cab: true },
    attractions: ['Tiger Hill', 'Darjeeling Himalayan Railway', 'Peace Pagoda', 'Rock Garden', 'Tea Gardens']
  },
  {
    name: 'Puri', state: 'Odisha',
    description: 'Sacred beach city with Jagannath Temple',
    location: { type: 'Point', coordinates: [85.8314, 19.8134] },
    estimatedCostPerDay: 1200, transportCostFromNearestCity: 800,
    minDays: 2, recommendedDays: 3,
    tags: ['beach', 'spiritual', 'temple', 'heritage', 'seafood'],
    bestMonths: [9,10,11,12,1,2,3,4],
    nearestCity: 'Kolkata', nearestCityCoordinates: { lat: 22.5726, lng: 88.3639 },
    popularityScore: 8,
    transportOptions: { train: true, bus: true, flight: false, cab: true },
    attractions: ['Jagannath Temple', 'Puri Beach', 'Konark Sun Temple', 'Chilika Lake', 'Raghurajpur Village']
  },
  {
    name: 'Pondicherry', state: 'Puducherry',
    description: 'French Quarter charm meets Tamil culture and beaches',
    location: { type: 'Point', coordinates: [79.8083, 11.9416] },
    estimatedCostPerDay: 1800, transportCostFromNearestCity: 600,
    minDays: 2, recommendedDays: 3,
    tags: ['beach', 'french heritage', 'spiritual', 'yoga', 'peaceful', 'unique'],
    bestMonths: [10,11,12,1,2,3,4,5],
    nearestCity: 'Chennai', nearestCityCoordinates: { lat: 13.0827, lng: 80.2707 },
    popularityScore: 8,
    transportOptions: { train: true, bus: true, flight: false, cab: true },
    attractions: ['Promenade Beach', 'Auroville', 'French Quarter', 'Sri Aurobindo Ashram', 'Paradise Beach']
  },
  {
    name: 'Kodaikanal', state: 'Tamil Nadu',
    description: 'Princess of hill stations in the Palani Hills',
    location: { type: 'Point', coordinates: [77.4892, 10.2381] },
    estimatedCostPerDay: 1700, transportCostFromNearestCity: 900,
    minDays: 2, recommendedDays: 3,
    tags: ['hills', 'lake', 'nature', 'trekking', 'peaceful', 'romantic'],
    bestMonths: [9,10,11,12,1,2,3,4,5,6],
    nearestCity: 'Chennai', nearestCityCoordinates: { lat: 13.0827, lng: 80.2707 },
    popularityScore: 8,
    transportOptions: { train: false, bus: true, flight: false, cab: true },
    attractions: ['Kodai Lake', 'Coaker\'s Walk', 'Pine Forest', 'Silver Cascade Falls', 'Pillar Rocks']
  },
  {
    name: 'Spiti Valley', state: 'Himachal Pradesh',
    description: 'Cold desert mountain valley — off the beaten path',
    location: { type: 'Point', coordinates: [78.0357, 32.2461] },
    estimatedCostPerDay: 2500, transportCostFromNearestCity: 2000,
    minDays: 5, recommendedDays: 7,
    tags: ['adventure', 'mountains', 'desert', 'buddhist', 'photography', 'offbeat'],
    bestMonths: [5,6,7,8,9],
    nearestCity: 'Delhi', nearestCityCoordinates: { lat: 28.6139, lng: 77.2090 },
    popularityScore: 7,
    transportOptions: { train: false, bus: true, flight: false, cab: true },
    attractions: ['Key Monastery', 'Chandratal Lake', 'Kaza', 'Dhankar Monastery', 'Pin Valley']
  },
  {
    name: 'Kasol', state: 'Himachal Pradesh',
    description: 'Mini Israel of India — backpacker paradise in Parvati Valley',
    location: { type: 'Point', coordinates: [77.3143, 32.0090] },
    estimatedCostPerDay: 1500, transportCostFromNearestCity: 1000,
    minDays: 3, recommendedDays: 4,
    tags: ['mountains', 'trekking', 'backpacking', 'camping', 'nature', 'offbeat'],
    bestMonths: [3,4,5,6,9,10,11],
    nearestCity: 'Delhi', nearestCityCoordinates: { lat: 28.6139, lng: 77.2090 },
    popularityScore: 8,
    transportOptions: { train: false, bus: true, flight: false, cab: true },
    attractions: ['Kheerganga Trek', 'Chalal Trek', 'Parvati River', 'Manikaran Sahib', 'Tosh Village']
  },
  {
    name: 'Leh Ladakh', state: 'Ladakh',
    description: 'Land of high passes — India\'s crown jewel',
    location: { type: 'Point', coordinates: [77.5771, 34.1526] },
    estimatedCostPerDay: 3000, transportCostFromNearestCity: 5000,
    minDays: 5, recommendedDays: 7,
    tags: ['mountains', 'desert', 'buddhist', 'adventure', 'photography', 'unique'],
    bestMonths: [5,6,7,8,9],
    nearestCity: 'Delhi', nearestCityCoordinates: { lat: 28.6139, lng: 77.2090 },
    popularityScore: 10,
    transportOptions: { train: false, bus: true, flight: true, cab: true },
    attractions: ['Pangong Lake', 'Nubra Valley', 'Magnetic Hill', 'Shanti Stupa', 'Leh Palace']
  },
  {
    name: 'Varanasi', state: 'Uttar Pradesh',
    description: 'Oldest living city — spiritual capital of India',
    location: { type: 'Point', coordinates: [82.9739, 25.3176] },
    estimatedCostPerDay: 1200, transportCostFromNearestCity: 800,
    minDays: 2, recommendedDays: 3,
    tags: ['spiritual', 'culture', 'heritage', 'ghats', 'history', 'unique'],
    bestMonths: [9,10,11,12,1,2,3,4],
    nearestCity: 'Delhi', nearestCityCoordinates: { lat: 28.6139, lng: 77.2090 },
    popularityScore: 9,
    transportOptions: { train: true, bus: true, flight: true, cab: true },
    attractions: ['Dashashwamedh Ghat', 'Kashi Vishwanath Temple', 'Sarnath', 'Manikarnika Ghat', 'Boat Ride at Dawn']
  },
  {
    name: 'Andaman Islands', state: 'Andaman & Nicobar',
    description: 'Tropical paradise with pristine coral reefs',
    location: { type: 'Point', coordinates: [92.7265, 11.7401] },
    estimatedCostPerDay: 3500, transportCostFromNearestCity: 8000,
    minDays: 4, recommendedDays: 6,
    tags: ['beach', 'scuba diving', 'snorkeling', 'island', 'nature', 'unique'],
    bestMonths: [10,11,12,1,2,3,4,5],
    nearestCity: 'Chennai', nearestCityCoordinates: { lat: 13.0827, lng: 80.2707 },
    popularityScore: 9,
    transportOptions: { train: false, bus: false, flight: true, cab: true },
    attractions: ['Radhanagar Beach', 'Cellular Jail', 'Ross Island', 'Neil Island', 'Elephant Beach']
  },
  {
    name: 'Lansdowne', state: 'Uttarakhand',
    description: 'Hidden gem — peaceful cantonment town in Garhwal',
    location: { type: 'Point', coordinates: [78.6865, 29.8395] },
    estimatedCostPerDay: 1400, transportCostFromNearestCity: 700,
    minDays: 2, recommendedDays: 2,
    tags: ['hills', 'peaceful', 'nature', 'offbeat', 'cantonment', 'trekking'],
    bestMonths: [3,4,5,9,10,11,12,1,2],
    nearestCity: 'Delhi', nearestCityCoordinates: { lat: 28.6139, lng: 77.2090 },
    popularityScore: 6,
    transportOptions: { train: true, bus: true, flight: false, cab: true },
    attractions: ['Tip N Top', 'Bhim Pakora', 'St. Mary\'s Church', 'Tarkeshwar Mahadev', 'Santoshi Mata Temple']
  },
  {
    name: 'Chikmagalur', state: 'Karnataka',
    description: 'Coffee land of Karnataka with misty hills',
    location: { type: 'Point', coordinates: [75.7762, 13.3161] },
    estimatedCostPerDay: 1800, transportCostFromNearestCity: 700,
    minDays: 2, recommendedDays: 3,
    tags: ['coffee', 'hills', 'trekking', 'nature', 'peaceful', 'waterfalls'],
    bestMonths: [9,10,11,12,1,2,3,4,5,6],
    nearestCity: 'Bangalore', nearestCityCoordinates: { lat: 12.9716, lng: 77.5946 },
    popularityScore: 8,
    transportOptions: { train: false, bus: true, flight: false, cab: true },
    attractions: ['Mullayanagiri Peak', 'Baba Budangiri', 'Hebbe Falls', 'Kudremukh', 'Coffee Estates']
  },
  {
    name: 'Khajuraho', state: 'Madhya Pradesh',
    description: 'UNESCO site — medieval temples with intricate sculptures',
    location: { type: 'Point', coordinates: [79.9199, 24.8318] },
    estimatedCostPerDay: 1500, transportCostFromNearestCity: 1200,
    minDays: 1, recommendedDays: 2,
    tags: ['heritage', 'UNESCO', 'temples', 'history', 'photography', 'unique'],
    bestMonths: [9,10,11,12,1,2,3],
    nearestCity: 'Delhi', nearestCityCoordinates: { lat: 28.6139, lng: 77.2090 },
    popularityScore: 7,
    transportOptions: { train: true, bus: true, flight: true, cab: true },
    attractions: ['Kandariya Mahadev Temple', 'Lakshmana Temple', 'Eastern Group Temples', 'Panna National Park', 'Raneh Falls']
  },
  {
    name: 'Shillong', state: 'Meghalaya',
    description: 'Scotland of the East — cleanest city with living root bridges',
    location: { type: 'Point', coordinates: [91.8833, 25.5788] },
    estimatedCostPerDay: 1500, transportCostFromNearestCity: 2000,
    minDays: 3, recommendedDays: 4,
    tags: ['hills', 'nature', 'waterfalls', 'northeast', 'unique', 'music'],
    bestMonths: [9,10,11,12,1,2,3,4,5,6],
    nearestCity: 'Kolkata', nearestCityCoordinates: { lat: 22.5726, lng: 88.3639 },
    popularityScore: 7,
    transportOptions: { train: false, bus: true, flight: true, cab: true },
    attractions: ['Elephant Falls', 'Shillong Peak', 'Ward\'s Lake', 'Don Bosco Museum', 'Mawlynnong Village']
  },
  {
    name: 'Amer', state: 'Rajasthan',
    description: 'Fortified palace town near Jaipur',
    location: { type: 'Point', coordinates: [75.8513, 26.9855] },
    estimatedCostPerDay: 1500, transportCostFromNearestCity: 200,
    minDays: 1, recommendedDays: 1,
    tags: ['heritage', 'forts', 'history', 'rajasthan', 'day trip'],
    bestMonths: [9,10,11,12,1,2,3],
    nearestCity: 'Delhi', nearestCityCoordinates: { lat: 28.6139, lng: 77.2090 },
    popularityScore: 8,
    transportOptions: { train: false, bus: true, flight: false, cab: true },
    attractions: ['Amer Fort', 'Sheesh Mahal', 'Diwan-e-Aam', 'Jaigarh Fort', 'Panna Meena ka Kund']
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding...');

    await Destination.deleteMany({});
    console.log('Cleared existing destinations');

    await Destination.insertMany(destinations);
    console.log(`✅ Seeded ${destinations.length} destinations successfully`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedDB();