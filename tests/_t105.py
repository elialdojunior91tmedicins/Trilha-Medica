import sqlite3,zipfile,json,sys,io,tempfile,os
z=zipfile.ZipFile(sys.argv[1]);names=z.namelist();assert "collection.anki2" in names and "media" in names,names
t=tempfile.mktemp();open(t,"wb").write(z.read("collection.anki2"))
c=sqlite3.connect(t);ic=c.execute("pragma integrity_check").fetchone()[0]
col=c.execute("select crt,ver,models,decks from col").fetchone();m=json.loads(col[2]);d=json.loads(col[3])
notes=c.execute("select guid,mid,tags,flds,sfld,csum from notes").fetchall();cards=c.execute("select nid,did,type,queue,due,ivl,factor from cards").fetchall()
print(json.dumps({"ic":ic,"ver":col[1],"model":[x["name"] for x in m.values()],"flds":[f["name"] for x in m.values() for f in x["flds"]],"decks":sorted(x["name"] for x in d.values()),"notes":len(notes),"cards":len(cards),"f0":notes[0][3].split("\x1f") if notes else [],"tags":notes[0][2] if notes else "","c0":cards[0] if cards else [],"media":z.read("media").decode()}))