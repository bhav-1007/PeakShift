// Sample seed listings relative to Date.now() with GeoJSON geometries
const getSampleListings = () => {
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  return [
    {
      title: "Cloud Kitchen Dinner Rush Packers",
      description:
        "Pack online food orders, label bags, coordinate with riders, and keep the dispatch counter clear during the dinner spike.",
      image: {
        filename: "listingimage",
        url: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=900&q=70",
      },
      price: 150,
      roleType: "Order packer",
      workersNeeded: 3,
      startAt: new Date(now + 2 * hour),
      endAt: new Date(now + 5 * hour),
      filledCount: 0,
      status: "open",
      skillTags: ["packing", "food safety", "dispatch"],
      location: "Indiranagar, Bengaluru",
      geometry: {
        type: "Point",
        coordinates: [77.6412, 12.9719], // [longitude, latitude]
      },
    },
    {
      title: "Cafe Morning Counter Support",
      description:
        "Help with order taking, table clearing, takeaway packing, and customer queue flow during the morning coffee rush.",
      image: {
        filename: "listingimage",
        url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=70",
      },
      price: 140,
      roleType: "Cafe helper",
      workersNeeded: 2,
      startAt: new Date(now + 6 * hour),
      endAt: new Date(now + 9 * hour),
      filledCount: 0,
      status: "open",
      skillTags: ["counter", "queue handling", "cleaning"],
      location: "Koramangala, Bengaluru",
      geometry: {
        type: "Point",
        coordinates: [77.6271, 12.9352],
      },
    },
    {
      title: "Retail Weekend Billing Assistants",
      description:
        "Support the store team with billing queues, shelf restocking, trial room returns, and customer movement during peak footfall.",
      image: {
        filename: "listingimage",
        url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=70",
      },
      price: 160,
      roleType: "Retail floor associate",
      workersNeeded: 4,
      startAt: new Date(now + 1 * day),
      endAt: new Date(now + 1 * day + 4 * hour),
      filledCount: 0,
      status: "open",
      skillTags: ["POS", "restocking", "customer support"],
      location: "Phoenix Marketcity, Mumbai",
      geometry: {
        type: "Point",
        coordinates: [72.889, 19.086],
      },
    },
    {
      title: "Pharmacy Evening Queue Support",
      description:
        "Organize pickup orders, manage customer queues, and assist the billing counter under the supervision of the pharmacy manager.",
      image: {
        filename: "listingimage",
        url: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=900&q=70",
      },
      price: 145,
      roleType: "Pharmacy support",
      workersNeeded: 2,
      startAt: new Date(now + 1 * day + 6 * hour),
      endAt: new Date(now + 1 * day + 9 * hour),
      filledCount: 0,
      status: "open",
      skillTags: ["queue handling", "billing support", "inventory"],
      location: "Aundh, Pune",
      geometry: {
        type: "Point",
        coordinates: [73.8077, 18.558],
      },
    },
    {
      title: "Multiplex Showtime Crowd Crew",
      description:
        "Guide guests between screens, scan tickets, manage snack counter spillover, and support cleaning between back-to-back showtimes.",
      image: {
        filename: "listingimage",
        url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=70",
      },
      price: 155,
      roleType: "Cinema crew",
      workersNeeded: 5,
      startAt: new Date(now + 2 * day),
      endAt: new Date(now + 2 * day + 4 * hour),
      filledCount: 0,
      status: "open",
      skillTags: ["ticketing", "crowd flow", "cleaning"],
      location: "Noida Sector 18",
      geometry: {
        type: "Point",
        coordinates: [77.3209, 28.5708],
      },
    },
    {
      title: "College Fest Entry Desk Team",
      description:
        "Support registration, wristband distribution, guest directions, and stage-area queue control during the evening entry rush.",
      image: {
        filename: "listingimage",
        url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=900&q=70",
      },
      price: 180,
      roleType: "Event crew",
      workersNeeded: 8,
      startAt: new Date(now + 3 * day),
      endAt: new Date(now + 3 * day + 4 * hour),
      filledCount: 0,
      status: "open",
      skillTags: ["registration", "crowd control", "guest support"],
      location: "South Campus, Delhi",
      geometry: {
        type: "Point",
        coordinates: [77.1691, 28.5833],
      },
    },
  ];
};

module.exports = {
  data: getSampleListings(),
  getSampleListings,
};
