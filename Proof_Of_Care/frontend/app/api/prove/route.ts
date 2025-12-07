import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { birthYear } = await request.json();
    const currentYear = new Date().getFullYear();

    if (!birthYear || isNaN(birthYear)) {
      return NextResponse.json(
        { error: 'Invalid birth year' },
        { status: 400 }
      );
    }

    // Use absolute path - most reliable
    const command = `cd /home/lupo1977/HumanityLink/leo/age_check && leo run prove_age ${birthYear}u16 ${currentYear}u16 18u16`;
    
    const { stdout } = await execAsync(command, {
      timeout: 30000,
      shell: '/bin/bash'
    });

    const isAdult = stdout.includes('• true');

    return NextResponse.json({
      success: true,
      isAdult,
      currentYear,
      message: isAdult 
        ? '✅ Age ≥ 18 Verified' 
        : '❌ Age < 18'
    });

  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}