
(function(){
class ChunkLoader {
  constructor(mode){
    this.mode=mode;
    this.manifest=null;
    this.cache=new Map();
    this.maxChunks=6;
  }

  async init(){
    if(this.mode==="offline"){
      this.manifest=window.OFFLINE_MANIFEST;
    }else{
      const r=await fetch("data/manifest.json",{cache:"no-cache"});
      if(!r.ok) throw new Error("Nie udało się wczytać manifestu: "+r.status);
      this.manifest=await r.json();
    }
    this.maxChunks=this.manifest.ram_chunk_limit||6;
    return this.manifest;
  }

  async gunzip(bytes){
    if(typeof DecompressionStream==="undefined"){
      throw new Error("Ta przeglądarka nie obsługuje DecompressionStream(gzip). Użyj aktualnego Chrome/Edge/Firefox/Safari.");
    }
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).text();
  }

  b64bytes(s){
    const bin=atob(s), out=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i);
    return out;
  }

  touch(path,records){
    if(this.cache.has(path)) this.cache.delete(path);
    this.cache.set(path,records);
    while(this.cache.size>this.maxChunks){
      const first=this.cache.keys().next().value;
      this.cache.delete(first);
    }
  }

  async load(path){
    if(this.cache.has(path)){
      const r=this.cache.get(path);
      this.touch(path,r);
      return r;
    }

    let bytes;
    if(this.mode==="offline"){
      const b64=window.OFFLINE_GZ[path];
      if(!b64) throw new Error("Brak paczki offline: "+path);
      bytes=this.b64bytes(b64);
    }else{
      const res=await fetch(path);
      if(!res.ok) throw new Error("Błąd pobierania "+path+": "+res.status);
      bytes=new Uint8Array(await res.arrayBuffer());
    }

    const text=await this.gunzip(bytes);
    const records=[];
    for(const line of text.split(/\n+/)){
      const s=line.trim();
      if(s) records.push(JSON.parse(s));
    }
    this.touch(path,records);
    return records;
  }

  stats(){
    let records=0;
    for(const r of this.cache.values()) records+=r.length;
    return {chunks:this.cache.size,records};
  }
}
window.ChunkLoader=ChunkLoader;
})();
