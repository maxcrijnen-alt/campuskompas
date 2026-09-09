"""Extract explicitly printed room codes; never generate number ranges.

Coordinates refer to the centre of the printed label, not a surveyed doorway.
Run with the public NHL Stenden guide at work/maps/campus-guide.pdf.
Ambiguous abbreviated labels and floor conflicts require manual review.
"""
import json
import re
from pathlib import Path
import pdfplumber

root = Path(__file__).resolve().parent.parent
catalog, review = [], []
with pdfplumber.open(root / 'work/maps/campus-guide.pdf') as pdf:
    for page_index in range(17, 25):
        page = pdf.pages[page_index]
        building = 'R8' if page_index < 21 else 'R10'
        floor = (page_index - 17) % 4
        chars = [{**c, 'text':letter} for c in page.chars for letter in c['text']]
        text = ''.join(c['text'] for c in chars)
        pattern = r'[A-H][0-3][0-9]{3}' if building == 'R10' else r'(?:[A-H])?[0-3]\.(?:[1-4]\.)?[0-9]{2}[a-d]?'
        seen = set()
        for match in re.finditer(pattern, text):
            code = match.group()
            cs = chars[match.start():match.end()]
            # PDF glyphs must form one compact label, not text from separate rooms.
            x0, x1 = min(c['x0'] for c in cs), max(c['x1'] for c in cs)
            y0, y1 = min(c['top'] for c in cs), max(c['bottom'] for c in cs)
            actual_floor = int(re.search(r'\d', code).group())
            if actual_floor != floor or x1-x0 > 45 or y1-y0 > 16:
                review.append({'page':page_index+1, 'label':code, 'reason':'floor or label geometry conflict'})
                continue
            if code in seen:
                continue
            seen.add(code)
            catalog.append({'code':code,'building_id':building,'floor_id':f'{building}-{floor}',
                'map_x':round((x0+x1)/2/page.width*100,3),
                'map_y':round((y0+y1)/2/page.height*100,3),'source_page':page_index+1})
catalog.sort(key=lambda r:(r['floor_id'],r['code']))
(root/'lib/campus/room-catalog.json').write_text(json.dumps(catalog,indent=2)+'\n',encoding='utf-8')
(root/'work/room-import-review.json').write_text(json.dumps(review,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'rooms':len(catalog),'by_floor':{f:sum(r['floor_id']==f for r in catalog) for f in sorted({r['floor_id'] for r in catalog})},'flagged':len(review)}))
