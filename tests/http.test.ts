import {it,expect} from 'vitest';
import {sameOrigin,boundedBody,readJson} from '../lib/server/http';
it('accepts reverse-proxied same-origin and rejects other origins',()=>{expect(()=>sameOrigin(new Request('http://localhost:3000/api',{headers:{host:'127.0.0.1:3000',origin:'http://127.0.0.1:3000'}}))).not.toThrow();expect(()=>sameOrigin(new Request('https://campus.example/api',{headers:{host:'campus.example',origin:'https://evil.example'}}))).toThrow('FORBIDDEN');});
it('enforces actual streamed body length',async()=>{await expect(boundedBody(new Request('https://campus.example/api',{method:'POST',body:'x'.repeat(100)}),20)).rejects.toThrow('TOO_LARGE');});
it('invalid JSON produces a controlled error',async()=>{await expect(readJson(new Request('https://campus.example/api',{method:'POST',body:'{'}))).rejects.toThrow('INVALID_INPUT');});
