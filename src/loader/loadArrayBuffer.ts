export async function loadArrayBuffer(url: string): Promise<ArrayBuffer>{
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
}