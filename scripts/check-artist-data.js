import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('=== Checking Database Data ===');
    
    // Check artists with workspace info
    const artists = await prisma.artist.findMany({
      take: 5,
      select: { 
        id: true, 
        name: true, 
        workspaceId: true,
        workspace: {
          select: { name: true }
        }
      }
    });
    console.log('Artists found:', artists.length);
    console.log('Sample artists with workspace:', artists);
    
    // Check stream data
    const streamData = await prisma.streamWeekly.findMany({
      take: 5,
      select: { 
        id: true, 
        artistId: true, 
        weekStart: true, 
        streams: true,
        region: true 
      }
    });
    console.log('Stream data found:', streamData.length);
    console.log('Sample stream data:', streamData);
    
    // Check specific artist "Babybartier"
    const babybartier = await prisma.artist.findFirst({
      where: { name: 'Babybartier' },
      select: {
        id: true,
        name: true,
        workspaceId: true,
        _count: {
          select: { streams: true }
        }
      }
    });
    console.log('Babybartier details:', babybartier);
    
    if (babybartier) {
      // Check if Babybartier has stream data
      const babybartierStreams = await prisma.streamWeekly.findMany({
        where: { artistId: babybartier.id },
        select: { weekStart: true, streams: true, region: true }
      });
      console.log('Babybartier streams:', babybartierStreams);
    }
    
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
