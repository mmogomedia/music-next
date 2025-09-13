const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SOUTH_AFRICAN_PROVINCES = [
  'Western Cape',
  'Eastern Cape',
  'Northern Cape',
  'Free State',
  'KwaZulu-Natal',
  'North West',
  'Gauteng',
  'Mpumalanga',
  'Limpopo',
];

const PROVINCIAL_DEMO_TRACKS = {
  'Western Cape': [
    {
      title: 'Cape Town Vibes',
      artist: 'Cape Town Collective',
      genre: 'Afro House',
      duration: 245,
      playCount: 12500,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Table Mountain Dreams',
      artist: 'Mountain Sound',
      genre: 'Deep House',
      duration: 320,
      playCount: 8900,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'V&A Waterfront',
      artist: 'Harbor Beats',
      genre: 'Electronic',
      duration: 280,
      playCount: 15600,
      coverImageUrl:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Stellenbosch Wine',
      artist: 'Wine Country Music',
      genre: 'Jazz',
      duration: 195,
      playCount: 7200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Robben Island',
      artist: 'Freedom Sounds',
      genre: 'Soul',
      duration: 310,
      playCount: 9800,
      coverImageUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Cape Point',
      artist: 'Ocean Waves',
      genre: 'Ambient',
      duration: 265,
      playCount: 6400,
      coverImageUrl:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Boulders Beach',
      artist: 'Penguin Parade',
      genre: 'Funk',
      duration: 220,
      playCount: 11200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Garden Route',
      artist: 'Nature Beats',
      genre: 'World Music',
      duration: 350,
      playCount: 8300,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Franschhoek Valley',
      artist: 'Valley Vibes',
      genre: 'Acoustic',
      duration: 240,
      playCount: 5900,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Cape Winelands',
      artist: 'Vineyard Music',
      genre: 'Blues',
      duration: 290,
      playCount: 7600,
      coverImageUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    },
  ],
  'Eastern Cape': [
    {
      title: 'Wild Coast',
      artist: 'Coastal Beats',
      genre: 'Reggae',
      duration: 275,
      playCount: 9200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Port Elizabeth',
      artist: 'PE Collective',
      genre: 'Hip Hop',
      duration: 310,
      playCount: 11800,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Addo Elephant',
      artist: 'Safari Sounds',
      genre: 'World Music',
      duration: 260,
      playCount: 6800,
      coverImageUrl:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Grahamstown',
      artist: 'Arts Festival',
      genre: 'Classical',
      duration: 420,
      playCount: 4500,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Jeffreys Bay',
      artist: 'Surf City',
      genre: 'Surf Rock',
      duration: 235,
      playCount: 8900,
      coverImageUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Tsitsikamma',
      artist: 'Forest Vibes',
      genre: 'Ambient',
      duration: 380,
      playCount: 5200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Nelson Mandela Bay',
      artist: 'Madiba Tribute',
      genre: 'Soul',
      duration: 320,
      playCount: 15600,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Cradock',
      artist: 'Karoo Sounds',
      genre: 'Folk',
      duration: 280,
      playCount: 3400,
      coverImageUrl:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'East London',
      artist: 'Buffalo City',
      genre: 'Electronic',
      duration: 295,
      playCount: 7200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Hogsback',
      artist: 'Mountain Music',
      genre: 'Acoustic',
      duration: 340,
      playCount: 4100,
      coverImageUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    },
  ],
  Gauteng: [
    {
      title: 'Johannesburg',
      artist: 'Jozi Beats',
      genre: 'Hip Hop',
      duration: 285,
      playCount: 25600,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Pretoria',
      artist: 'Capital City',
      genre: 'Afro Pop',
      duration: 310,
      playCount: 18900,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Soweto',
      artist: 'Township Vibes',
      genre: 'Kwaito',
      duration: 270,
      playCount: 31200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Sandton',
      artist: 'City Lights',
      genre: 'Deep House',
      duration: 320,
      playCount: 14200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Midrand',
      artist: 'Highway Sounds',
      genre: 'Electronic',
      duration: 295,
      playCount: 9800,
      coverImageUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Rosebank',
      artist: 'Urban Beats',
      genre: 'R&B',
      duration: 265,
      playCount: 12800,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Melville',
      artist: 'Bohemian Vibes',
      genre: 'Indie',
      duration: 340,
      playCount: 7600,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Fourways',
      artist: 'Suburban Sounds',
      genre: 'Pop',
      duration: 250,
      playCount: 11200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Centurion',
      artist: 'Tech Hub',
      genre: 'Future Bass',
      duration: 300,
      playCount: 8900,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Roodepoort',
      artist: 'West Side',
      genre: 'Gqom',
      duration: 275,
      playCount: 15600,
      coverImageUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    },
  ],
  'KwaZulu-Natal': [
    {
      title: 'Durban',
      artist: 'Golden Mile',
      genre: 'Bhangra',
      duration: 320,
      playCount: 22300,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Pietermaritzburg',
      artist: 'Maritzburg Beats',
      genre: 'Afro House',
      duration: 290,
      playCount: 12800,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Ballito',
      artist: 'Coastal Vibes',
      genre: 'Deep House',
      duration: 310,
      playCount: 15600,
      coverImageUrl:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Umhlanga',
      artist: 'Pearl City',
      genre: 'Electronic',
      duration: 275,
      playCount: 18900,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Newcastle',
      artist: 'Steel City',
      genre: 'Rock',
      duration: 340,
      playCount: 9200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Richards Bay',
      artist: 'Harbor City',
      genre: 'Reggae',
      duration: 300,
      playCount: 7600,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Pinetown',
      artist: 'Industrial Beats',
      genre: 'Techno',
      duration: 285,
      playCount: 11200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Hillcrest',
      artist: 'Valley Sounds',
      genre: 'Acoustic',
      duration: 260,
      playCount: 6400,
      coverImageUrl:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Amanzimtoti',
      artist: 'Toti Vibes',
      genre: 'Soul',
      duration: 295,
      playCount: 8300,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Westville',
      artist: 'Suburban Beats',
      genre: 'Jazz',
      duration: 350,
      playCount: 5900,
      coverImageUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    },
  ],
  'Free State': [
    {
      title: 'Bloemfontein',
      artist: 'City of Roses',
      genre: 'Folk',
      duration: 280,
      playCount: 8900,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Welkom',
      artist: 'Gold City',
      genre: 'Blues',
      duration: 310,
      playCount: 5600,
      coverImageUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Bethlehem',
      artist: 'Highlands',
      genre: 'Country',
      duration: 265,
      playCount: 4200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Kroonstad',
      artist: 'Crown City',
      genre: 'Rock',
      duration: 295,
      playCount: 3800,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Sasolburg',
      artist: 'Industrial',
      genre: 'Electronic',
      duration: 320,
      playCount: 2900,
      coverImageUrl:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Parys',
      artist: 'River City',
      genre: 'Acoustic',
      duration: 250,
      playCount: 3400,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Vredefort',
      artist: 'Dome Sounds',
      genre: 'Ambient',
      duration: 380,
      playCount: 2100,
      coverImageUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Harrismith',
      artist: 'Mountain Town',
      genre: 'World Music',
      duration: 340,
      playCount: 2800,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Clarens',
      artist: 'Art Town',
      genre: 'Indie',
      duration: 300,
      playCount: 3600,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Ficksburg',
      artist: 'Cherry Town',
      genre: 'Folk',
      duration: 275,
      playCount: 1900,
      coverImageUrl:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    },
  ],
  Limpopo: [
    {
      title: 'Polokwane',
      artist: 'Capital City',
      genre: 'Afro Pop',
      duration: 290,
      playCount: 11200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Tzaneen',
      artist: 'Tropical Vibes',
      genre: 'Reggae',
      duration: 320,
      playCount: 7600,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Thohoyandou',
      artist: 'Venda Beats',
      genre: 'Traditional',
      duration: 350,
      playCount: 8900,
      coverImageUrl:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Mokopane',
      artist: 'Potgietersrus',
      genre: 'Kwaito',
      duration: 275,
      playCount: 6400,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Musina',
      artist: 'Border Town',
      genre: 'World Music',
      duration: 310,
      playCount: 4200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Louis Trichardt',
      artist: 'Makhado',
      genre: 'Folk',
      duration: 280,
      playCount: 3800,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Phalaborwa',
      artist: 'Copper Town',
      genre: 'Blues',
      duration: 295,
      playCount: 2900,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Hoedspruit',
      artist: 'Safari Sounds',
      genre: 'Ambient',
      duration: 340,
      playCount: 2100,
      coverImageUrl:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Modimolle',
      artist: 'Mountain Music',
      genre: 'Acoustic',
      duration: 260,
      playCount: 3400,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Lephalale',
      artist: 'Coal City',
      genre: 'Rock',
      duration: 300,
      playCount: 1800,
      coverImageUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    },
  ],
  Mpumalanga: [
    {
      title: 'Nelspruit',
      artist: 'Lowveld Beats',
      genre: 'Afro House',
      duration: 310,
      playCount: 12800,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Kruger National Park',
      artist: 'Safari Sounds',
      genre: 'World Music',
      duration: 380,
      playCount: 15600,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'White River',
      artist: 'Citrus Valley',
      genre: 'Folk',
      duration: 275,
      playCount: 5600,
      coverImageUrl:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Hazyview',
      artist: 'Hazy Vibes',
      genre: 'Reggae',
      duration: 320,
      playCount: 7200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Sabie',
      artist: 'Forest Town',
      genre: 'Ambient',
      duration: 340,
      playCount: 4200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Graskop',
      artist: 'Panorama Route',
      genre: 'Acoustic',
      duration: 290,
      playCount: 3800,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: "Pilgrim's Rest",
      artist: 'Gold Rush',
      genre: 'Country',
      duration: 265,
      playCount: 2900,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Barberton',
      artist: 'Makhonjwa',
      genre: 'Rock',
      duration: 300,
      playCount: 3400,
      coverImageUrl:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Secunda',
      artist: 'Sasol City',
      genre: 'Electronic',
      duration: 285,
      playCount: 2100,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Ermelo',
      artist: 'Highveld',
      genre: 'Blues',
      duration: 310,
      playCount: 1800,
      coverImageUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    },
  ],
  'North West': [
    {
      title: 'Mahikeng',
      artist: 'Capital City',
      genre: 'Afro Pop',
      duration: 290,
      playCount: 8900,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Rustenburg',
      artist: 'Platinum City',
      genre: 'Kwaito',
      duration: 275,
      playCount: 11200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Potchefstroom',
      artist: 'Student City',
      genre: 'Indie',
      duration: 320,
      playCount: 7600,
      coverImageUrl:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Klerksdorp',
      artist: 'Gold City',
      genre: 'Rock',
      duration: 300,
      playCount: 6400,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Brits',
      artist: 'Agricultural',
      genre: 'Folk',
      duration: 280,
      playCount: 4200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Lichtenburg',
      artist: 'Sunflower City',
      genre: 'Country',
      duration: 265,
      playCount: 2900,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Vryburg',
      artist: 'Cattle Country',
      genre: 'Blues',
      duration: 295,
      playCount: 2100,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Wolmaransstad',
      artist: 'Wheat Fields',
      genre: 'Acoustic',
      duration: 310,
      playCount: 1800,
      coverImageUrl:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Hartbeespoort',
      artist: 'Dam City',
      genre: 'Electronic',
      duration: 285,
      playCount: 3400,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Zeerust',
      artist: 'Border Town',
      genre: 'World Music',
      duration: 340,
      playCount: 1500,
      coverImageUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    },
  ],
  'Northern Cape': [
    {
      title: 'Kimberley',
      artist: 'Diamond City',
      genre: 'Blues',
      duration: 300,
      playCount: 7200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Upington',
      artist: 'Orange River',
      genre: 'Folk',
      duration: 320,
      playCount: 5600,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Springbok',
      artist: 'Namaqualand',
      genre: 'World Music',
      duration: 340,
      playCount: 4200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Kuruman',
      artist: 'Eye of Kuruman',
      genre: 'Ambient',
      duration: 380,
      playCount: 2900,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'De Aar',
      artist: 'Railway Town',
      genre: 'Country',
      duration: 275,
      playCount: 2100,
      coverImageUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Calvinia',
      artist: 'Hantam',
      genre: 'Acoustic',
      duration: 290,
      playCount: 1800,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Pofadder',
      artist: 'Desert Town',
      genre: 'Electronic',
      duration: 310,
      playCount: 1200,
      coverImageUrl:
        'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Kakamas',
      artist: 'River Town',
      genre: 'Reggae',
      duration: 285,
      playCount: 1500,
      coverImageUrl:
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Prieska',
      artist: 'Copper Town',
      genre: 'Rock',
      duration: 300,
      playCount: 900,
      coverImageUrl:
        'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=400&fit=crop&crop=center',
    },
    {
      title: 'Port Nolloth',
      artist: 'Coastal Town',
      genre: 'Soul',
      duration: 265,
      playCount: 1100,
      coverImageUrl:
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center',
    },
  ],
};

async function main() {
  try {
    console.log('🎵 Adding demo tracks to provincial playlists...');

    // Get admin user and their artist profile
    const admin = await prisma.user.findFirst({
      where: { email: 'dev@dev.com' },
      include: { artistProfile: true },
    });

    if (!admin) {
      console.error(
        '❌ Admin user not found. Please run create-admin.js first.'
      );
      return;
    }

    if (!admin.artistProfile) {
      console.error(
        '❌ Admin user has no artist profile. Please run create-admin-artist-profile.js first.'
      );
      return;
    }

    console.log(`✅ Found admin user: ${admin.name} (${admin.email})`);
    console.log(`✅ Found artist profile: ${admin.artistProfile.artistName}`);

    // Get or create provincial playlists
    const provincialPlaylists = [];

    for (const province of SOUTH_AFRICAN_PROVINCES) {
      let playlist = await prisma.playlist.findFirst({
        where: {
          name: province,
          type: 'PROVINCE',
        },
      });

      if (!playlist) {
        playlist = await prisma.playlist.create({
          data: {
            name: province,
            description: `Music from ${province}`,
            type: 'PROVINCE',
            status: 'ACTIVE',
            submissionStatus: 'OPEN',
            maxTracks: 50,
            maxSubmissionsPerArtist: 3,
            coverImage:
              'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop&crop=center',
            createdByUser: {
              connect: { id: admin.id },
            },
          },
        });
        console.log(`✅ Created playlist: ${province}`);
      } else {
        console.log(`✅ Found existing playlist: ${province}`);
      }

      provincialPlaylists.push(playlist);
    }

    // Add demo tracks to each provincial playlist
    for (const playlist of provincialPlaylists) {
      const provinceTracks = PROVINCIAL_DEMO_TRACKS[playlist.name] || [];

      console.log(
        `\n🎵 Adding ${provinceTracks.length} tracks to ${playlist.name}...`
      );

      for (let i = 0; i < provinceTracks.length; i++) {
        const trackData = provinceTracks[i];

        try {
          // Create track
          const track = await prisma.track.create({
            data: {
              title: trackData.title,
              artist: trackData.artist,
              genre: trackData.genre,
              duration: trackData.duration,
              playCount: trackData.playCount,
              coverImageUrl: trackData.coverImageUrl,
              filePath: `demo-tracks/${playlist.name.toLowerCase().replace(/\s+/g, '-')}/${trackData.title.toLowerCase().replace(/\s+/g, '-')}.mp3`,
              uniqueUrl: `demo-${playlist.name.toLowerCase().replace(/\s+/g, '-')}-${trackData.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
              isPublic: true,
              userId: admin.id,
              artistProfileId: admin.artistProfile.id,
            },
          });

          // Add track to playlist
          await prisma.playlistTrack.create({
            data: {
              playlist: {
                connect: { id: playlist.id },
              },
              track: {
                connect: { id: track.id },
              },
              order: i + 1,
              addedByUser: {
                connect: { id: admin.id },
              },
            },
          });

          console.log(`  ✅ Added: ${track.title} by ${track.artist}`);
        } catch (error) {
          console.error(
            `  ❌ Error adding track ${trackData.title}:`,
            error.message
          );
        }
      }
    }

    console.log(
      '\n🎉 Successfully added demo tracks to all provincial playlists!'
    );
    console.log('📊 Summary:');

    for (const playlist of provincialPlaylists) {
      const trackCount = await prisma.playlistTrack.count({
        where: { playlistId: playlist.id },
      });
      console.log(`  ${playlist.name}: ${trackCount} tracks`);
    }
  } catch (error) {
    console.error('❌ Error adding provincial demo tracks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
