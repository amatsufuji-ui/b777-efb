import React, { useState, useEffect } from 'react';

export const SidView = ({ state }) => {
    const [selectedWaypoint, setSelectedWaypoint] = useState('ROVER');
    
    const initialType = state.selectedType || '777-300ER';
    const [manualAircraftType, setManualAircraftType] = useState(initialType);
    
    // Default TOW
    const [towLbs, setTowLbs] = useState(769); // in 1000LBS
    const [oat, setOat] = useState(30);

    const waypoints = ['ROVER', 'TAURA', 'WELDA'];
        // FPLのPTOWを反映
    useEffect(() => {
        const w = state.ptowOrig || state.cruiseWeight;
        if (w) {
            setTowLbs(Math.round(w / 1000));
        }
    }, [state.ptowOrig, state.cruiseWeight]);

       // FPLのPTOWを反映
    useEffect(() => {
        const w = state.ptowOrig || state.cruiseWeight;
        if (w) {
            setTowLbs(Math.round(w / 1000));
        }
    }, [state.ptowOrig, state.cruiseWeight]);

    // Parse limits dynamically based on Waypoint and Aircraft Type
    const { maxWeight, minWeight } = useMemo(() => {
        let max = 769;
        let min = 400;
        
        if (selectedWaypoint === 'WELDA') {
            if (manualAircraftType === '777-300ER') { max = 769; min = 700; }
            if (manualAircraftType === '787-8') { max = 503; min = 480; } // 502,500lbs -> 503
            if (manualAircraftType === '787-9') { max = 553; min = 500; }
        } else if (selectedWaypoint === 'TAURA') {
            if (manualAircraftType.includes('777-200')) { max = 535; min = 440; }
            if (manualAircraftType === '777-300') { max = 550; min = 500; }
            if (manualAircraftType === '787-8') { max = 503; min = 440; } // 502,500lbs -> 503
            if (manualAircraftType === '787-9') { max = 490; min = 430; }
            if (manualAircraftType === '787-10') { max = 535; min = 450; }
        } else if (selectedWaypoint === 'ROVER') {
            if (manualAircraftType === '777-300ER') { max = 769; min = 600; }
            if (manualAircraftType === '787-8') { max = 503; min = 440; } // 502,500lbs -> 503
            if (manualAircraftType === '787-9') { max = 553; min = 500; }
        } else {
            // Fallbacks
            if (manualAircraftType.includes('777-200')) { max = 550; min = 400; }
            else if (manualAircraftType === '777-300') { max = 550; min = 400; }
            else if (manualAircraftType === '777-300ER') { max = 769; min = 400; }
            else if (manualAircraftType === '787-8') { max = 503; min = 400; }
            else if (manualAircraftType === '787-9') { max = 553; min = 400; }
            else if (manualAircraftType === '787-10') { max = 535; min = 400; }
        }
        
        return { maxWeight: max, minWeight: min };
    }, [selectedWaypoint, manualAircraftType]);

    useEffect(() => {
        if (towLbs > maxWeight) setTowLbs(maxWeight);
        if (towLbs < minWeight) setTowLbs(minWeight);
    }, [maxWeight, minWeight]);

    // 利用可能なFlapのリストを取得
    const getAvailableFlaps = (wp, type) => {
        if (wp === 'WELDA') {
            if (type === '777-300ER') return ['15', '20'];
            if (type === '787-9') return ['5', '10', '15'];
            if (type === '787-8') return ['5'];
        }
        if (wp === 'TAURA') {
            if (type.includes('777-200')) return ['15'];
            if (type === '777-300') return ['20'];
            if (type === '787-8') return ['15/20'];
            if (type === '787-9') return ['18'];
            if (type === '787-10') return ['20'];
        }
        if (wp === 'ROVER') {
            if (type === '777-300ER') return ['15'];
            if (type.includes('787') && type !== '787-10') return ['5'];
        }
        return ['Optimum'];
    };

    const availableFlaps = getAvailableFlaps(selectedWaypoint, manualAircraftType);
    const [selectedFlap, setSelectedFlap] = useState(availableFlaps[0]);

    // Waypointや機体が切り替わった際にFlapをリセット
    useEffect(() => {
        const flaps = getAvailableFlaps(selectedWaypoint, manualAircraftType);
        if (!flaps.includes(selectedFlap)) {
            setSelectedFlap(flaps[0]);
        }
    }, [selectedWaypoint, manualAircraftType]);

    // Helper for 2D interpolation
    const interpolate2D = (t, o, data) => {
        const oats = Object.keys(data).map(Number).sort((a, b) => a - b);
        let oatL = oats[0], oatH = oats[oats.length - 1];
        if (o <= oatL) { oatH = oatL; }
        else if (o >= oatH) { oatL = oatH; }
        else {
            for (let i = 0; i < oats.length - 1; i++) {
                if (o >= oats[i] && o <= oats[i+1]) {
                    oatL = oats[i];
                    oatH = oats[i+1];
                    break;
                }
            }
        }

        const interpolate1D = (t_val, oat_val) => {
            if (!data[oat_val]) return "N/A";
            const rowData = [...data[oat_val]].sort((a, b) => b.w - a.w);
            const maxW = rowData[0].w;
            const minW = rowData[rowData.length - 1].w;
            
            if (t_val >= maxW) {
                return rowData.find(r => r.w === maxW).a;
            } else if (t_val <= minW) {
                return rowData.find(r => r.w === minW).a;
            } else {
                let idx = 0;
                for (let i = 0; i < rowData.length - 1; i++) {
                    if (t_val <= rowData[i].w && t_val >= rowData[i+1].w) { 
                        idx = i;
                        break;
                    }
                }
                const w1 = rowData[idx].w, a1 = rowData[idx].a;
                const w2 = rowData[idx+1].w, a2 = rowData[idx+1].a;
                if (a1 === "N/A" || a2 === "N/A") return "N/A";
                return a1 + (a2 - a1) * ((t_val - w1) / (w2 - w1));
            }
        };

        const altL = interpolate1D(t, oatL);
        const altH = interpolate1D(t, oatH);

        if (altL === "N/A" || altH === "N/A") return "N/A";
        
        if (oatL === oatH) return Math.round(altL);
        
        return Math.round(altL + (altH - altL) * ((o - oatL) / (oatH - oatL)));
    };

    const calculateAltitude = () => {
        const type = manualAircraftType;
        const wt = towLbs * 1000;
        
        let alt1500 = "N/A";
        let alt3000 = "N/A";
        let restriction = "";
        let isCleared1500 = false;
        let isCleared3000 = false;
        let noDataMsg = "";

        if (selectedWaypoint === 'WELDA') {
            restriction = "6000 ft or Above (RWY16L)";
            if (type === '777-300ER') {
                if (selectedFlap === '20') {
                    const data1500 = {
                        38: [{w:769000,a:4990},{w:760000,a:5080},{w:750000,a:5163},{w:740000,a:5303},{w:730000,a:5463},{w:720000,a:5628},{w:700000,a:5782}],
                        36: [{w:769000,a:5236},{w:760000,a:5254},{w:750000,a:5393},{w:740000,a:5554},{w:730000,a:5701},{w:720000,a:5872},{w:700000,a:6011}],
                        34: [{w:769000,a:5466},{w:760000,a:5744},{w:750000,a:5652},{w:740000,a:5816},{w:730000,a:5968},{w:720000,a:6057},{w:700000,a:6137}],
                        32: [{w:769000,a:5710},{w:760000,a:5986},{w:750000,a:6067},{w:740000,a:6024},{w:730000,a:6100},{w:720000,a:6182},{w:700000,a:6274}],
                        30: [{w:769000,a:5948},{w:760000,a:6096},{w:750000,a:6067},{w:740000,a:6144},{w:730000,a:6228},{w:720000,a:6314},{w:700000,a:6404}]
                    };
                    const data3000 = {
                        38: [{w:769000,a:5571},{w:760000,a:5645},{w:750000,a:5720},{w:740000,a:5866},{w:730000,a:5988},{w:720000,a:6137},{w:700000,a:6065}],
                        36: [{w:769000,a:5780},{w:760000,a:5807},{w:750000,a:5954},{w:740000,a:6031},{w:730000,a:6108},{w:720000,a:6183},{w:700000,a:6268}],
                        34: [{w:769000,a:5987},{w:760000,a:6107},{w:750000,a:6071},{w:740000,a:6145},{w:730000,a:6228},{w:720000,a:6314},{w:700000,a:6404}],
                        32: [{w:769000,a:6097},{w:760000,a:6223},{w:750000,a:6312},{w:740000,a:6269},{w:730000,a:6355},{w:720000,a:6445},{w:700000,a:6527}],
                        30: [{w:769000,a:6189},{w:760000,a:6327},{w:750000,a:6414},{w:740000,a:6398},{w:730000,a:6477},{w:720000,a:6550},{w:700000,a:6650}]
                    };
                    alt1500 = interpolate2D(wt, oat, data1500);
                    alt3000 = interpolate2D(wt, oat, data3000);
                } else {
                    const data1500 = {
                        38: [{w:769000,a:5003},{w:760000,a:5250},{w:750000,a:5407},{w:740000,a:5547},{w:730000,a:5709},{w:720000,a:5860},{w:700000,a:6004}],
                        36: [{w:769000,a:5224},{w:760000,a:5498},{w:750000,a:5638},{w:740000,a:5803},{w:730000,a:5950},{w:720000,a:6048},{w:700000,a:6128}],
                        34: [{w:769000,a:5475},{w:760000,a:5734},{w:750000,a:5897},{w:740000,a:6010},{w:730000,a:6095},{w:720000,a:6176},{w:700000,a:6261}],
                        32: [{w:769000,a:5721},{w:760000,a:5982},{w:750000,a:6053},{w:740000,a:6140},{w:730000,a:6223}],
                        30: [{w:769000,a:5946},{w:760000,a:6101},{w:750000,a:6185},{w:740000,a:6267}]
                    };
                    const data3000 = {
                        38: [{w:769000,a:5551},{w:760000,a:5804},{w:750000,a:5933},{w:740000,a:6030},{w:730000,a:6098},{w:720000,a:6173},{w:700000,a:6262}],
                        36: [{w:769000,a:5781},{w:760000,a:5998},{w:750000,a:6073},{w:740000,a:6145},{w:730000,a:6219},{w:720000,a:6298},{w:700000,a:6379}],
                        34: [{w:769000,a:5983},{w:760000,a:6115},{w:750000,a:6187},{w:740000,a:6262},{w:730000,a:6340},{w:720000,a:6422},{w:700000,a:6509}],
                        32: [{w:769000,a:6092},{w:760000,a:6226},{w:750000,a:6301},{w:740000,a:6380},{w:730000,a:6462}],
                        30: [{w:769000,a:6200},{w:760000,a:6341},{w:750000,a:6420},{w:740000,a:6503}]
                    };
                    alt1500 = interpolate2D(wt, oat, data1500);
                    alt3000 = interpolate2D(wt, oat, data3000);
                }
            } else if (type === '787-8') {
                const data1500 = {
                    38: [{w:502500,a:5964},{w:500000,a:6004},{w:490000,a:6098},{w:480000,a:6222}],
                    37: [{w:502500,a:6056},{w:500000,a:6079},{w:490000,a:6178},{w:480000,a:6294}],
                    36: [{w:502500,a:6133},{w:500000,a:6145},{w:490000,a:6248}],
                    35: [{w:502500,a:6200},{w:500000,a:6224}]
                };
                const data3000 = {
                    38: [{w:502500,a:6178},{w:500000,a:6190},{w:490000,a:6287},{w:480000,a:6400}],
                    37: [{w:502500,a:6241},{w:500000,a:6263},{w:490000,a:6353},{w:480000,a:6468}],
                    36: [{w:502500,a:6305},{w:500000,a:6328},{w:490000,a:6431}],
                    35: [{w:502500,a:6381},{w:500000,a:6392}]
                };
                alt1500 = interpolate2D(wt, oat, data1500);
                alt3000 = interpolate2D(wt, oat, data3000);
            } else if (type === '787-9') {
                if (selectedFlap === '5') {
                    const data1500 = {
                        38: [{w:553000,a:5488},{w:550000,a:5517},{w:540000,a:5712},{w:530000,a:5931},{w:520000,a:6076},{w:510000,a:6193}],
                        36: [{w:553000,a:5770},{w:550000,a:5800},{w:540000,a:6000},{w:530000,a:6110},{w:520000,a:6216}],
                        34: [{w:553000,a:6023},{w:550000,a:6048},{w:540000,a:6140},{w:530000,a:6258}],
                        32: [{w:553000,a:6165},{w:550000,a:6192},{w:540000,a:6280}],
                        30: [{w:553000,a:6298},{w:550000,a:6316}]
                    };
                    const data3000 = {
                        38: [{w:553000,a:5918},{w:550000,a:5967},{w:540000,a:6065},{w:530000,a:6160},{w:520000,a:6271},{w:510000,a:6377}],
                        36: [{w:553000,a:6086},{w:550000,a:6100},{w:540000,a:6188},{w:530000,a:6288},{w:520000,a:6406}],
                        34: [{w:553000,a:6214},{w:550000,a:6228},{w:540000,a:6323},{w:530000,a:6429}],
                        32: [{w:553000,a:6331},{w:550000,a:6359},{w:540000,a:6448}],
                        30: [{w:553000,a:6443},{w:550000,a:6473}]
                    };
                    alt1500 = interpolate2D(wt, oat, data1500);
                    alt3000 = interpolate2D(wt, oat, data3000);
                } else if (selectedFlap === '10') {
                    const data1500 = {
                        38: [{w:553000,a:5473},{w:550000,a:5521},{w:540000,a:5693},{w:530000,a:5911},{w:520000,a:6066},{w:510000,a:6181},{w:500000,a:6308}],
                        36: [{w:553000,a:5756},{w:550000,a:5805},{w:540000,a:5985},{w:530000,a:6101},{w:520000,a:6218}],
                        34: [{w:553000,a:6027},{w:550000,a:6051},{w:540000,a:6142},{w:530000,a:6249}],
                        32: [{w:553000,a:6159},{w:550000,a:6186},{w:540000,a:6284}],
                        30: [{w:553000,a:6294}]
                    };
                    const data3000 = {
                        38: [{w:553000,a:5910},{w:550000,a:5956},{w:540000,a:6059},{w:530000,a:6163},{w:520000,a:6264},{w:510000,a:6383},{w:500000,a:6486}],
                        36: [{w:553000,a:6082},{w:550000,a:6105},{w:540000,a:6191},{w:530000,a:6294},{w:520000,a:6402}],
                        34: [{w:553000,a:6209},{w:550000,a:6235},{w:540000,a:6329},{w:530000,a:6424}],
                        32: [{w:553000,a:6341},{w:550000,a:6356},{w:540000,a:6456}],
                        30: [{w:553000,a:6443}]
                    };
                    alt1500 = interpolate2D(wt, oat, data1500);
                    alt3000 = interpolate2D(wt, oat, data3000);
                } else if (selectedFlap === '15') {
                    const data1500 = {
                        38: [{w:553000,a:5423},{w:550000,a:5468},{w:540000,a:5634},{w:530000,a:5852},{w:520000,a:6037},{w:510000,a:6153},{w:500000,a:6268}],
                        36: [{w:553000,a:5706},{w:550000,a:5753},{w:540000,a:5928},{w:530000,a:6074},{w:520000,a:6181},{w:510000,a:6305}],
                        34: [{w:553000,a:6000},{w:550000,a:6017},{w:540000,a:6105},{w:530000,a:6222}],
                        32: [{w:553000,a:6137},{w:550000,a:6161},{w:540000,a:6253}],
                        30: [{w:553000,a:6275}]
                    };
                    const data3000 = {
                        38: [{w:553000,a:5851},{w:550000,a:5894},{w:540000,a:6035},{w:530000,a:6138},{w:520000,a:6240},{w:510000,a:6350},{w:500000,a:6468}],
                        36: [{w:553000,a:6052},{w:550000,a:6073},{w:540000,a:6157},{w:530000,a:6270},{w:520000,a:6382},{w:510000,a:6498}],
                        34: [{w:553000,a:6190},{w:550000,a:6214},{w:540000,a:6296},{w:530000,a:6405}],
                        32: [{w:553000,a:6312},{w:550000,a:6339},{w:540000,a:6425}],
                        30: [{w:553000,a:6429}]
                    };
                    alt1500 = interpolate2D(wt, oat, data1500);
                    alt3000 = interpolate2D(wt, oat, data3000);
                }
            } else {
                noDataMsg = "No Data Available for this Type at WELDA";
            }
        } else if (selectedWaypoint === 'TAURA') {
             restriction = "9000 ft or Above (RWY16R)";
             if (type === '777-200' || type === '777-200ER') {
                 const data1500 = {
                    38: [{w:535000,a:7198},{w:505000,a:7990},{w:495000,a:8271},{w:485000,a:8557},{w:475000,a:8857},{w:465000,a:9190},{w:447400,a:9357},{w:440000,a:9489}],
                    36: [{w:535000,a:7468},{w:505000,a:8273},{w:495000,a:8560},{w:485000,a:8851},{w:475000,a:9157},{w:465000,a:9468},{w:447400,a:9521}],
                    34: [{w:535000,a:7733},{w:505000,a:8551},{w:495000,a:8843},{w:485000,a:9144},{w:475000,a:9451},{w:447400,a:9670}],
                    32: [{w:535000,a:7987},{w:505000,a:8824},{w:495000,a:9144},{w:485000,a:9451},{w:447400,a:9852}],
                    30: [{w:535000,a:8253},{w:505000,a:9106},{w:495000,a:9433},{w:447400,a:10009}]
                 };
                 const data3000 = {
                    38: [{w:535000,a:7524},{w:505000,a:8303},{w:495000,a:8581},{w:485000,a:8868},{w:475000,a:9159},{w:465000,a:9465},{w:447400,a:9511},{w:440000,a:9645}],
                    36: [{w:535000,a:7790},{w:505000,a:8584},{w:495000,a:8862},{w:485000,a:9155},{w:475000,a:9452},{w:465000,a:9764},{w:447400,a:9661}],
                    34: [{w:535000,a:8041},{w:505000,a:8851},{w:495000,a:9135},{w:485000,a:9433},{w:475000,a:9736},{w:447400,a:9826}],
                    32: [{w:535000,a:8302},{w:505000,a:9103},{w:495000,a:9396},{w:485000,a:9723},{w:447400,a:9982}],
                    30: [{w:535000,a:8538},{w:505000,a:9356},{w:495000,a:9656},{w:447400,a:10123}]
                 };
                 alt1500 = interpolate2D(wt, oat, data1500);
                 alt3000 = interpolate2D(wt, oat, data3000);
             } else if (type === '777-300') {
                 const data1500 = {
                    38: [{w:550000,a:8533},{w:540000,a:8792},{w:530000,a:9018},{w:520000,a:9158},{w:510000,a:9305},{w:500000,a:9456}],
                    36: [{w:550000,a:8816},{w:540000,a:9028},{w:530000,a:9166},{w:520000,a:9300},{w:510000,a:9443}],
                    34: [{w:550000,a:9033},{w:540000,a:9169},{w:530000,a:9301},{w:520000,a:9442}],
                    32: [{w:550000,a:9172},{w:540000,a:9303}],
                    30: [{w:550000,a:9313},{w:540000,a:9452}]
                 };
                 const data3000 = {
                    38: [{w:550000,a:8895},{w:540000,a:9062},{w:530000,a:9182},{w:520000,a:9329},{w:510000,a:9469},{w:500000,a:9620}],
                    36: [{w:550000,a:9058},{w:540000,a:9190},{w:530000,a:9335},{w:520000,a:9474},{w:510000,a:9622}],
                    34: [{w:550000,a:9197},{w:540000,a:9340},{w:530000,a:9478},{w:520000,a:9623}],
                    32: [{w:550000,a:9338},{w:540000,a:9473}],
                    30: [{w:550000,a:9478},{w:540000,a:9621}]
                 };
                 alt1500 = interpolate2D(wt, oat, data1500);
                 alt3000 = interpolate2D(wt, oat, data3000);
             } else if (type === '787-8') {
                 const data1500 = {
                     38: [{w:490000,a:7317},{w:480000,a:7616},{w:470000,a:7928},{w:460000,a:8254},{w:450000,a:8589},{w:440000,a:8936}],
                     36: [{w:490000,a:7713},{w:480000,a:7994},{w:470000,a:8312},{w:460000,a:8639},{w:450000,a:8981},{w:440000,a:9154}],
                     34: [{w:502500,a:7778},{w:490000,a:8053},{w:480000,a:8368},{w:470000,a:8691},{w:460000,a:9003},{w:450000,a:9176},{w:440000,a:9350}],
                     32: [{w:502500,a:8036},{w:490000,a:8317},{w:480000,a:8639},{w:470000,a:8971},{w:460000,a:9131},{w:450000,a:9295}],
                     30: [{w:502500,a:8347},{w:490000,a:8664},{w:480000,a:8979},{w:470000,a:9136},{w:460000,a:9302}]
                 };
                 const data3000 = {
                     38: [{w:490000,a:7696},{w:480000,a:7989},{w:470000,a:8289},{w:460000,a:8605},{w:450000,a:8933},{w:440000,a:9122}],
                     36: [{w:490000,a:8067},{w:480000,a:8368},{w:470000,a:8648},{w:460000,a:8970},{w:450000,a:9139},{w:440000,a:9305}],
                     34: [{w:502500,a:8121},{w:490000,a:8394},{w:480000,a:8696},{w:470000,a:8994},{w:460000,a:9143},{w:450000,a:9323},{w:440000,a:9496}],
                     32: [{w:502500,a:8349},{w:490000,a:8629},{w:480000,a:8945},{w:470000,a:9109},{w:460000,a:9286},{w:450000,a:9455}],
                     30: [{w:502500,a:8653},{w:490000,a:8960},{w:480000,a:9114},{w:470000,a:9272},{w:460000,a:9442}]
                 };
                 alt1500 = interpolate2D(wt, oat, data1500);
                 alt3000 = interpolate2D(wt, oat, data3000);
             } else if (type === '787-9') {
                 const data1500 = {
                     38: [{w:490000,a:7416},{w:480000,a:7717},{w:470000,a:8006},{w:460000,a:8335},{w:450000,a:8698},{w:440000,a:9012},{w:430000,a:9176}],
                     36: [{w:490000,a:7775},{w:480000,a:8090},{w:470000,a:8410},{w:460000,a:8744},{w:450000,a:9031},{w:440000,a:9210},{w:430000,a:9389}],
                     34: [{w:490000,a:8109},{w:480000,a:8431},{w:470000,a:8757},{w:460000,a:9036},{w:450000,a:9197},{w:440000,a:9389},{w:430000,a:9561}],
                     32: [{w:490000,a:8386},{w:480000,a:8710},{w:470000,a:9011},{w:460000,a:9186},{w:450000,a:9356}],
                     30: [{w:490000,a:8688},{w:480000,a:8994},{w:470000,a:9155},{w:460000,a:9340}]
                 };
                 const data3000 = {
                     38: [{w:490000,a:7831},{w:480000,a:8131},{w:470000,a:8440},{w:460000,a:8753},{w:450000,a:9027},{w:440000,a:9199},{w:430000,a:9368}],
                     36: [{w:490000,a:8193},{w:480000,a:8499},{w:470000,a:8814},{w:460000,a:9056},{w:450000,a:9215},{w:440000,a:9379},{w:430000,a:9559}],
                     34: [{w:490000,a:8494},{w:480000,a:8807},{w:470000,a:9052},{w:460000,a:9205},{w:450000,a:9385},{w:440000,a:9547},{w:430000,a:9741}],
                     32: [{w:490000,a:8733},{w:480000,a:9015},{w:470000,a:9181},{w:460000,a:9343},{w:450000,a:9515}],
                     30: [{w:490000,a:8990},{w:480000,a:9151},{w:470000,a:9313},{w:460000,a:9483}]
                 };
                 alt1500 = interpolate2D(wt, oat, data1500);
                 alt3000 = interpolate2D(wt, oat, data3000);
             } else if (type === '787-10') {
                 const data1500 = {
                     38: [{w:535000,a:6976},{w:520000,a:7373},{w:491600,a:8183},{w:480000,a:8553},{w:470000,a:8855},{w:460000,a:9071},{w:450000,a:9234}],
                     36: [{w:535000,a:7314},{w:520000,a:7751},{w:491600,a:8563},{w:480000,a:8909},{w:470000,a:9112},{w:460000,a:9274},{w:450000,a:9434}],
                     34: [{w:535000,a:7705},{w:520000,a:8120},{w:491600,a:8955},{w:480000,a:9142},{w:470000,a:9307}],
                     32: [{w:535000,a:8076},{w:520000,a:8503},{w:491600,a:9153},{w:480000,a:9344},{w:470000,a:9521}],
                     30: [{w:535000,a:8406},{w:520000,a:8850},{w:491600,a:9347}]
                 };
                 const data3000 = {
                     38: [{w:535000,a:7366},{w:520000,a:7756},{w:491600,a:8549},{w:480000,a:8910},{w:470000,a:9089},{w:460000,a:9246},{w:450000,a:9397}],
                     36: [{w:535000,a:7688},{w:520000,a:8085},{w:491600,a:8908},{w:480000,a:9110},{w:470000,a:9266},{w:460000,a:9433},{w:450000,a:9594}],
                     34: [{w:535000,a:8051},{w:520000,a:8465},{w:491600,a:9128},{w:480000,a:9309},{w:470000,a:9459}],
                     32: [{w:535000,a:8386},{w:520000,a:8811},{w:491600,a:9306},{w:480000,a:9482},{w:470000,a:9641}],
                     30: [{w:535000,a:8672},{w:520000,a:9041},{w:491600,a:9480}]
                 };
                 alt1500 = interpolate2D(wt, oat, data1500);
                 alt3000 = interpolate2D(wt, oat, data3000);
             } else {
                 noDataMsg = `No Data Available for ${type} at TAURA`;
             }
        } else if (selectedWaypoint === 'ROVER') {
             restriction = "12000 ft or Above (RWY34R)";
             if (type === '777-300ER') {
                 const data1500 = {
                     38: [{w:769000,a:10120},{w:750000,a:10591},{w:725000,a:11257},{w:700000,a:11976},{w:675000,a:12374},{w:650000,a:12812},{w:625000,a:13247},{w:600000,a:13680}],
                     36: [{w:769000,a:10558},{w:750000,a:11034},{w:725000,a:11710},{w:700000,a:12214},{w:675000,a:12636},{w:650000,a:13070},{w:625000,a:13500},{w:600000,a:13936}],
                     34: [{w:769000,a:11008},{w:750000,a:11493},{w:725000,a:12076},{w:700000,a:12466},{w:675000,a:12899},{w:625000,a:12236}],
                     32: [{w:769000,a:11461},{w:750000,a:11972},{w:725000,a:12334},{w:700000,a:12738},{w:675000,a:13167}],
                     30: [{w:769000,a:11933},{w:750000,a:12206},{w:700000,a:12590}]
                 };
                 const data3000 = {
                     38: [{w:769000,a:10551},{w:750000,a:11001},{w:725000,a:11697},{w:700000,a:12205},{w:675000,a:12607},{w:650000,a:13063},{w:625000,a:13512},{w:600000,a:13957}],
                     36: [{w:769000,a:10985},{w:750000,a:11466},{w:725000,a:12055},{w:700000,a:12433},{w:675000,a:12862},{w:650000,a:13322},{w:625000,a:13780},{w:600000,a:14230}],
                     34: [{w:769000,a:11412},{w:750000,a:11901},{w:725000,a:12290},{w:700000,a:12690},{w:675000,a:13142},{w:625000,a:13605}],
                     32: [{w:769000,a:11861},{w:750000,a:12169},{w:725000,a:12541},{w:700000,a:12960},{w:675000,a:13400}],
                     30: [{w:769000,a:12143},{w:750000,a:12395},{w:700000,a:12795}]
                 };
                 alt1500 = interpolate2D(wt, oat, data1500);
                 alt3000 = interpolate2D(wt, oat, data3000);
             } else if (type === '787-8') {
                 const data1500 = {
                     38: [{w:502500,a:11759},{w:500000,a:11826},{w:490000,a:12071},{w:480000,a:12251},{w:462900,a:12642},{w:440000,a:13562}],
                     36: [{w:502500,a:12121},{w:500000,a:12157},{w:490000,a:12341},{w:480000,a:12535}],
                     34: [{w:502500,a:12363},{w:500000,a:12405},{w:490000,a:12590},{w:480000,a:12788}],
                     32: [{w:502500,a:12595},{w:500000,a:12639}],
                     30: [{w:502500,a:12835},{w:500000,a:12870}]
                 };
                 const data3000 = {
                     38: [{w:502500,a:12006},{w:500000,a:12031},{w:490000,a:12206},{w:480000,a:12390},{w:462900,a:12774},{w:440000,a:13684}],
                     36: [{w:502500,a:12250},{w:500000,a:12280},{w:490000,a:12465},{w:480000,a:12660}],
                     34: [{w:502500,a:12491},{w:500000,a:12523},{w:490000,a:12724},{w:480000,a:12921}],
                     32: [{w:502500,a:12723},{w:500000,a:12759}],
                     30: [{w:502500,a:12949},{w:500000,a:12988}]
                 };
                 alt1500 = interpolate2D(wt, oat, data1500);
                 alt3000 = interpolate2D(wt, oat, data3000);
             } else if (type === '787-9') {
                 const data1500 = {
                     38: [{w:553000,a:10932},{w:550000,a:11031},{w:540000,a:11315},{w:530000,a:11624},{w:520000,a:11926},{w:510000,a:12134},{w:500000,a:12307}],
                     36: [{w:553000,a:11423},{w:550000,a:11521},{w:540000,a:11809},{w:530000,a:12052},{w:520000,a:12208},{w:510000,a:12392},{w:500000,a:12559}],
                     34: [{w:553000,a:11921},{w:550000,a:12010},{w:540000,a:12160},{w:530000,a:12318},{w:520000,a:12474},{w:510000,a:12652}],
                     32: [{w:553000,a:12233},{w:550000,a:12288},{w:540000,a:12437},{w:530000,a:12591},{w:520000,a:12753}],
                     30: [{w:553000,a:12503},{w:550000,a:12548},{w:540000,a:12701}]
                 };
                 const data3000 = {
                     38: [{w:553000,a:11290},{w:550000,a:11354},{w:540000,a:11622},{w:530000,a:11922},{w:520000,a:12107},{w:510000,a:12264},{w:500000,a:12447}],
                     36: [{w:553000,a:11756},{w:550000,a:11820},{w:540000,a:12029},{w:530000,a:12191},{w:520000,a:12343},{w:510000,a:12508},{w:500000,a:12682}],
                     34: [{w:553000,a:12122},{w:550000,a:12145},{w:540000,a:12288},{w:530000,a:12440},{w:520000,a:12596},{w:510000,a:12763}],
                     32: [{w:553000,a:12375},{w:550000,a:12409},{w:540000,a:12551},{w:530000,a:12707},{w:520000,a:12865}],
                     30: [{w:553000,a:12635},{w:550000,a:12660},{w:540000,a:12805}]
                 };
                 alt1500 = interpolate2D(wt, oat, data1500);
                 alt3000 = interpolate2D(wt, oat, data3000);
             } else {
                 noDataMsg = `No Data Available for ${type} at ROVER`;
             }
        }

        const requiredAlt = parseInt(restriction.split(' ')[0]);

        if (typeof alt1500 === 'number') {
             isCleared1500 = alt1500 >= requiredAlt;
        }
        if (typeof alt3000 === 'number') {
             isCleared3000 = alt3000 >= requiredAlt;
        }
        
        return { 
            alt1500, 
            alt3000, 
            restriction, 
            isCleared1500, 
            isCleared3000,
            noDataMsg,
            flap: `T/O Flap ${selectedFlap}` 
        };
    };

    const result = calculateAltitude();

    // フォーマットヘルパー: 数字でクリアしていれば "XXXXA" と表示
    const formatAltitude = (alt, isCleared) => {
        if (typeof alt !== 'number') return alt;
        return isCleared ? `${alt}A` : `${alt}`;
    };

    return (
        <div className="flex flex-col gap-2 p-2 bg-slate-900 rounded-lg h-full overflow-y-auto">
            <h2 className="text-lg font-bold text-blue-400 border-b border-slate-700 pb-1 mb-2">HND SID Altitude Check</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Inputs */}
                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 space-y-4">
                    
                    {/* Waypoint Selector */}
                    <div className="flex gap-2">
                        {waypoints.map(wp => (
                            <button
                                key={wp}
                                onClick={() => setSelectedWaypoint(wp)}
                                className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${selectedWaypoint === wp ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                            >
                                {wp}
                            </button>
                        ))}
                    </div>

                    {/* Aircraft Type & Flap Selectors */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Aircraft Type</label>
                            <select 
                                value={manualAircraftType}
                                onChange={(e) => setManualAircraftType(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 text-white text-sm rounded p-1.5 focus:border-blue-500 outline-none"
                            >
                                <option value="777-200">777-200</option>
                                <option value="777-200ER">777-200ER</option>
                                <option value="777-300">777-300</option>
                                <option value="777-300ER">777-300ER</option>
                                <option value="787-8">787-8</option>
                                <option value="787-9">787-9</option>
                                <option value="787-10">787-10</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Takeoff Flap</label>
                            <select 
                                value={selectedFlap}
                                onChange={(e) => setSelectedFlap(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 text-white text-sm rounded p-1.5 focus:border-blue-500 outline-none"
                            >
                                {availableFlaps.map(f => (
                                    <option key={f} value={f}>Flap {f}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* TOW Slider */}
                    <div className="pt-2">
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-bold text-slate-300">Takeoff Weight (TOW)</label>
                            <span className="text-lg font-mono text-amber-400">{towLbs} <span className="text-xs text-slate-400">x1000 LBS</span></span>
                        </div>
                        <input
                            type="range"
                            min={minWeight}
                            max={maxWeight}
                            step={1}
                            value={towLbs}
                            onChange={(e) => setTowLbs(Number(e.target.value))}
                            className="w-full accent-blue-500"
                        />
                         <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                            <span>{minWeight}</span>
                            <span>{maxWeight}</span>
                        </div>
                    </div>

                    {/* OAT Slider */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-sm font-bold text-slate-300">OAT</label>
                            <span className="text-lg font-mono text-sky-400">{oat} <span className="text-xs text-slate-400">°C</span></span>
                        </div>
                        <input
                            type="range"
                            min={20}
                            max={40}
                            step={1}
                            value={oat}
                            onChange={(e) => setOat(Number(e.target.value))}
                            className="w-full accent-blue-500"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                            <span>20°C</span>
                            <span>40°C</span>
                        </div>
                    </div>
                </div>

                {/* Results */}
                <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex flex-col justify-center">
                    <div className="text-center space-y-2">
                        <div className="text-sm font-bold text-slate-400">{selectedWaypoint} Restriction</div>
                        <div className="text-xl font-bold text-rose-400">{result.restriction}</div>
                        
                        <div className="mt-4 mb-2 h-px bg-slate-700 w-full"></div>
                        
                        {result.noDataMsg ? (
                            <div className="text-amber-500 font-bold p-4 bg-amber-900/20 rounded-lg border border-amber-500/30">
                                {result.noDataMsg}
                            </div>
                        ) : (
                            <>
                                <div className="text-sm font-bold text-slate-400">Estimated Passing Altitude</div>
                                
                                <div className="flex justify-around items-center mt-2">
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs text-slate-500 mb-1">Ctbk 1500ft</span>
                                        <span className={`text-4xl font-mono font-black ${typeof result.alt1500 === 'number' ? (result.isCleared1500 ? 'text-emerald-400' : 'text-amber-500') : 'text-slate-500'}`}>
                                            {formatAltitude(result.alt1500, result.isCleared1500)}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-xs text-slate-500 mb-1">Ctbk 3000ft</span>
                                        <span className={`text-4xl font-mono font-black ${typeof result.alt3000 === 'number' ? (result.isCleared3000 ? 'text-emerald-400' : 'text-amber-500') : 'text-slate-500'}`}>
                                            {formatAltitude(result.alt3000, result.isCleared3000)}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

             <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 mt-2 text-xs text-slate-400 space-y-1">
                <p><strong className="text-slate-300">Calculation Conditions:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Aircraft: <span className="text-amber-400 font-mono">{manualAircraftType}</span></li>
                    <li>Configuration: {result.flap || "N/A"} / No Wind, QNH 29.92</li>
                    <li className="text-amber-600/80">* Values are estimates based on standard profiles and may differ from actual performance.</li>
                </ul>
            </div>
        </div>
    );
};っっっs