from fastapi import FastAPI

app = FastAPI(title="Socratic AI Engine")

@app.get("/")
def read_root():
    return {"Hello": "World"}
