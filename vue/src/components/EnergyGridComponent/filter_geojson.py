import json

def main():
    with open("scotland-power.geojson", 'r') as f:
        
        stats = dict()
        
        def add_stat(key, stat):
            if key not in stats:
                stats[key] = dict()
            statsd = stats[key]
            if stat not in statsd:
                statsd[stat] = 0
            statsd[stat] += 1
        
        i = 0
        while True:
            i+=1
            kekl = f.readline().strip().strip(',')
            if not len(kekl):
                break
            try:
                kekj = json.loads(kekl)
                #print(i, kekj)
                add_stat("type", kekj["type"])
                add_stat("geo_type", kekj["geometry"]["type"])
                power_kind = kekj["properties"].get("power", "not_found")
                add_stat("power", power_kind)
                if power_kind in ['line', 'substation', 'plant']:
                    print(kekj)
            except Exception as e:
                #print(e)
                continue
            
            
        
        for k,d in stats.items():
            print(k,d)
            
            

if __name__ == '__main__':
    main()