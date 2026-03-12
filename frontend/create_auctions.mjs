import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';

const API_GW = 'http://localhost:8080';
const USERNAME = 'v';
const PASSWORD = '1234';

const auctions = [
    {
        title: "Vintage Rolex Submariner",
        description: "An authentic, highly sought-after vintage Rolex Submariner. Incredibly well-preserved with original features intact. A true collector's dream piece.",
        startPrice: 8500.0,
        endTimeOffsetHours: 48,
        categoryId: 1, 
        itemCondition: "USED",
        shippingInfo: "Free Insured Express Delivery",
        tags: "watch,luxury,rolex,vintage",
        image: "vintage_rolex_watch_1773213273311.png"
    },
    {
        title: "Victorian Era Antique Clock",
        description: "An exquisitely detailed antique Victorian era wooden clock. Features stunning hand-carved wood accents and fully restored mechanical movement. Keeps perfect time.",
        startPrice: 1200.0,
        endTimeOffsetHours: 72,
        categoryId: 3, 
        itemCondition: "REFURBISHED",
        shippingInfo: "Special Care Shipping",
        tags: "antique,clock,victorian,woodwork",
        image: "antique_clock_1773213289250.png"
    },
    {
        title: "PSA 10 Holographic Charizard",
        description: "The holy grail of trading cards. A perfectly preserved, extremely rare holographic Charizard card. Professionally graded PSA 10 Gem Mint status.",
        startPrice: 150000.0,
        endTimeOffsetHours: 24,
        categoryId: 4, 
        itemCondition: "NEW",
        shippingInfo: "Armored Transport",
        tags: "pokemon,rare,charizard,psa10",
        image: "charizard_card_1773213305361.png"
    },
    {
        title: "Michael Jordan Signed Basketball",
        description: "An authentic basketball personally signed by the legendary Michael Jordan. Comes in a premium glass display case with a full Certificate of Authenticity (COA).",
        startPrice: 4200.0,
        endTimeOffsetHours: 96,
        categoryId: 4, 
        itemCondition: "NEW",
        shippingInfo: "Free Global Shipping",
        tags: "sports,mj,basketball,signed",
        image: "mj_basketball_1773213338541.png"
    },
    {
        title: "Classic 1960s Fender Stratocaster",
        description: "A gorgeous classic 1960s Fender Stratocaster electric guitar in a stunning sunburst finish. Exceptional tone, original pickups, and classic vintage aesthetic.",
        startPrice: 12500.0,
        endTimeOffsetHours: 72,
        categoryId: 2, 
        itemCondition: "USED",
        shippingInfo: "Hardcase Included - Insured",
        tags: "guitar,music,fender,vintage",
        image: "fender_guitar_1773213355143.png"
    },
    {
        title: "Ancient Roman Gold Coin",
        description: "A meticulously engraved ancient Roman gold coin. Shows remarkable preservation of detail. A fascinating piece of ancient history for discerning numismatists.",
        startPrice: 3800.0,
        endTimeOffsetHours: 48,
        categoryId: 3, 
        itemCondition: "USED",
        shippingInfo: "Courier Delivery",
        tags: "coin,roman,gold,ancient",
        image: "roman_coin_1773213370942.png"
    },
    {
        title: "Original Modern Abstract Art",
        description: "A striking original modern abstract painting on canvas. Features incredibly vibrant colors and dynamic textures that pop in any lighting. Authentic masterpiece.",
        startPrice: 2800.0,
        endTimeOffsetHours: 120,
        categoryId: 5, 
        itemCondition: "NEW",
        shippingInfo: "Crated Art Shipping",
        tags: "art,painting,abstract,modern",
        image: "abstract_art_1773213400867.png"
    },
    {
        title: "Diamond Platinum Ring",
        description: "A truly flawless, high-clarity diamond encrusted in a premium platinum band. Exceptional brilliance and cut, perfect for an unforgettable moment.",
        startPrice: 6500.0,
        endTimeOffsetHours: 48,
        categoryId: 1, 
        itemCondition: "NEW",
        shippingInfo: "Insured Secure Shipping",
        tags: "jewelry,diamond,ring,platinum",
        image: "diamond_ring_1773213421563.png"
    },
    {
        title: "Rare 1st Ed. Classic Book",
        description: "A spectacularly rare first edition classic literature book. Beautifully preserved with premium leather binding and delicate gold foil text. Missing from most collections.",
        startPrice: 2400.0,
        endTimeOffsetHours: 24,
        categoryId: 3, 
        itemCondition: "USED",
        shippingInfo: "Climate Controlled Shipping",
        tags: "book,literature,first-edition,antique",
        image: "classic_book_1773213443234.png"
    },
    {
        title: "Limited Edition Designer Handbag",
        description: "An exclusive, highly sought-after limited edition luxury designer handbag. Crafted from the finest premium leather with iconic hardware and detailing.",
        startPrice: 4900.0,
        endTimeOffsetHours: 72,
        categoryId: 1, 
        itemCondition: "NEW",
        shippingInfo: "Free Shipping",
        tags: "fashion,designer,handbag,luxury",
        image: "designer_handbag_1773213460572.png"
    }
];

async function run() {
    try {
        console.log("Logging in as " + USERNAME + "...");
        const loginRes = await axios.post(`${API_GW}/auth-service/auth/login`, { username: USERNAME, password: PASSWORD });
        const token = loginRes.data.access_token;
        console.log("Got JWT token successfully!");

        const dir = "C:\\Users\\dell\\.gemini\\antigravity\\brain\\f72847da-f2af-43ac-8e88-96f0c38305d4";

        for (const auction of auctions) {
            console.log(`Publishing auction: ${auction.title}...`);
            const formData = new FormData();
            formData.append('title', auction.title);
            formData.append('description', auction.description);
            formData.append('startPrice', auction.startPrice);
            
            // Generate standard ISO date time format
            const d = new Date(Date.now() + auction.endTimeOffsetHours * 3600000);
            formData.append('endTime', d.toISOString());
            
            formData.append('categoryId', auction.categoryId || 1);
            formData.append('itemCondition', auction.itemCondition);
            formData.append('shippingInfo', auction.shippingInfo);
            formData.append('tags', auction.tags);

            const fileStream = fs.createReadStream(path.join(dir, auction.image));
            formData.append('image', fileStream);

            await axios.post(`${API_GW}/auction-service/auctions`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    Authorization: `Bearer ${token}`
                }
            });
            console.log(` -> Success!`);
        }
        
        console.log("All 10 auctions created successfully.");
    } catch(err) {
        console.error("Error creating auctions:");
        if (err.response) {
            console.error(err.response.status, err.response.statusText);
            console.error(err.response.data);
        } else {
            console.error(err.message);
        }
    }
}
run();
