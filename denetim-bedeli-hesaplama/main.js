let uygulama_sayisi = 1;

//* Retrieve the options for ygInput
fetch("./data/birim-maliyet.json").then((response) => response.json()).then((bm_data) => {
    for (let index = 0; index < Object.keys(bm_data).length; index++) {
        const key_name = Object.keys(bm_data)[index];
        let key_name_sliced = key_name.slice(0, 1);

        for (let index = 0; index < Object.keys(bm_data[key_name]).length; index++) {
            const second_key_name = Object.keys(bm_data[key_name])[index];
            document.getElementById("ygInput").innerHTML += `
            <option value="`+ key_name_sliced + second_key_name + `">` + key_name_sliced + '-' + second_key_name + `</option>
            `;
        }
    }
});

function increase_us() {
    uygulama_sayisi += 1;
    document.getElementById("usInput").value = uygulama_sayisi.toString() + ". Uygulama";
}

function decrease_us() {
    if (uygulama_sayisi == 1) return;
    uygulama_sayisi -= 1;
    document.getElementById("usInput").value = uygulama_sayisi.toString() + ". Uygulama";
}

async function db_calculate() {
    let YA, BM, HBK, PYK;
    // YA : Yapı Alanı
    // BM : Birim Maliyet
    // HBK : Hizmet Bedeli Katsayısı
    // PYK : Proje Yineleme Katsayısı

    let should_calculate = true;
    let yaInput = document.getElementById("yaInput");
    let ygInput = document.getElementById("ygInput");

    YA = parseInt(yaInput.value);
    if (Number.isNaN(YA) || YA < 0 || YA > 100000) {
        yaInput.classList.add("border-3", "border-danger");
        should_calculate = false;
    }
    else {
        yaInput.classList.remove("border-3", "border-danger");
    }

    if (ygInput.value == "empty") {
        ygInput.classList.add("border-3", "border-danger");
        should_calculate = false;
    }
    else ygInput.classList.remove("border-3", "border-danger");

    if (should_calculate) {
        //* Calculate BM
        let ygInput_0 = ygInput.value[0];
        let ygInput_1 = ygInput.value[1];
        await fetch("./data/birim-maliyet.json").then((response) => response.json()).then((tablo1_data) => {
            BM = tablo1_data[ygInput_0 + ". sinif yapilar"][ygInput_1];
        });

        //* Calculate HBK
        await fetch("./data/hizmet-bedeli-cetveli.csv").then((response) => response.text()).then((d) => {
            data = d.split("\n");
            data.shift();

            let existing_YA_values = [];
            for (let index = 0; index < data.length; index++) {
                const row = data[index].split(",");
                existing_YA_values.push(parseInt(row[0]));
            }

            if (YA <= 600) {
                const reference_row = data[0].split(",");
                HBK = parseFloat(reference_row[1]) / 1000;
            }
            else {
                if (existing_YA_values.includes(YA)) { // no need for interpolation, data already exists.
                    for (let index = 0; index < data.length; index++) {
                        const row = data[index].split(",");
                        if (parseInt(row[0]) == YA) {
                            const reference_row = data[index].split(",");
                            HBK = parseFloat(reference_row[1]) / 1000;
                            break;
                        }
                    }
                }
                else { // use linear interpolation
                    for (let index = 0; index < data.length; index++) {
                        const row = data[index].split(",");

                        if (parseInt(row[0]) > YA) {
                            const reference_row1 = data[index - 1].split(",");
                            const reference_row2 = data[index].split(",");

                            HBK = (linear_interpolation(
                                [parseInt(reference_row1[0]), parseFloat(reference_row1[1])],
                                [parseInt(reference_row2[0]), parseFloat(reference_row2[1])],
                                YA
                            )) / 1000;
                            break;
                        }
                    }
                }
            }
        });

        //* Calculate PYK
        await fetch("./data/proje-yineleme-katsayisi.json").then((response) => response.json()).then((tablo5_data) => {
            let result = 0;
            for (let index = 1; index <= uygulama_sayisi; index++) {
                let k;
                if (index <= 4) k = index.toString();
                else k = ">4";

                result += tablo5_data[k];
            }
            PYK = parseFloat(result.toPrecision(4));
        });

        let result = YA * BM * HBK * PYK;
        let _result = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(result);
        // result = parseFloat(result.toPrecision(3));

        //* Log the calculation to the console
        const debug_log = {
            "HBK": HBK,
            "BM": BM,
            "PYK": PYK,
        };
        console.table(debug_log);
        console.info(_result);

        //* Display the result on UI
        document.getElementById("resultDiv").replaceChildren();
        let p = document.createElement("p");
        p.innerHTML = "Mesleki Denetim Hizmeti Bedeli: " + _result;
        p.className = "text-center mt-4 fs-5";
        document.getElementById("resultDiv").appendChild(p);

        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth"
        });
    }
}

function linear_interpolation(point1, point2, x) {
    let diff_x = point1[0] - point2[0];
    let diff_y = point1[1] - point2[1];
    return point1[1] + ((x - point1[0]) * diff_y / diff_x);
}