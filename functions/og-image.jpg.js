import p0 from '../src/og/part0.js';
import p1 from '../src/og/part1.js';
import p2 from '../src/og/part2.js';
import p3 from '../src/og/part3.js';
import p3b from '../src/og/.part3b.js';
import p4 from '../src/og/part4.js';
import p5 from '../src/og/part5.js';
import p6 from '../src/og/part6.js';

const DATA = p0 + p1 + p2 + p3 + p3b + p4 + p5 + p6;

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function onRequestGet() {
  return new Response(decodeBase64(DATA), {
    headers: {
      'content-type': 'image/jpeg',
      'cache-control': 'public, max-age=31536000, immutable',
      'content-disposition': 'inline; filename="og-speed-lash.jpg"'
    }
  });
}
