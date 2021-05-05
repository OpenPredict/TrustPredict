import makeBlockie from 'ethereum-blockies-base64';

const img = new Image() ;
img.src = makeBlockie('0x7cB57B5A97eAbe94205C07890BE4c1aD31E486A8');

document.body.appendChild(img);
