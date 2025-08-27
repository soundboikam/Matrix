import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testArtistAPI() {
  try {
    console.log('=== Testing Artist API Endpoint ===');
    
    // Get Babybartier's ID
    const babybartier = await prisma.artist.findFirst({
      where: { name: 'Babybartier' },
      select: { id: true, name: true }
    });
    
    if (!babybartier) {
      console.log('❌ Babybartier not found!');
      return;
    }
    
    console.log('Testing API for:', babybartier);
    
    // Simulate the exact query from the API endpoint
    const items = await prisma.streamWeekly.findMany({
      where: { artistId: babybartier.id },
      orderBy: [{ weekStart: "asc" }],
      select: { weekStart: true, streams: true },
    });
    
    console.log('Query result:', items);
    
    const points = items.map((i) => ({
      weekStart: i.weekStart.toISOString().slice(0, 10),
      streams: i.streams,
    }));
    
    console.log('Formatted points:', points);
    
    // Test with region filter
    const itemsWithRegion = await prisma.streamWeekly.findMany({
      where: { 
        artistId: babybartier.id,
        region: "US"
      },
      orderBy: [{ weekStart: "asc" }],
      select: { weekStart: true, streams: true, region: true },
    });
    
    console.log('Query with US region filter:', itemsWithRegion);
    
  } catch (error) {
    console.error('Error testing API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testArtistAPI();
