let uygulama_sayisi = 1;
let uygulama_sayisi_tab2 = 1;

fetch("./data/tablo8.json").then((response) => response.json()).then((tablo8_data) => {
    retrive_msInput_options(tablo8_data);
});

function retrive_msInput_options(data) {
    let msInput = document.getElementById("msInput");

    for (let index = 0; index < Object.keys(data).length; index++) {
        const city_name = Object.keys(data)[index];
        msInput.innerHTML += '<option id="' + city_name + '" value="' + city_name + '">' + city_name + '</option>';
    }
}

function msInput_selected(selected_value) {
    let pubInput = document.getElementById("pubInput");
    pubInput.innerHTML = "";

    //* retrieve the options for pubInput
    fetch("./data/tablo8.json").then((response) => response.json()).then((tablo8_data) => {
        for (let index = 0; index < Object.keys(tablo8_data[selected_value]).length; index++) {
            const element = Object.keys(tablo8_data[selected_value])[index];
            let html_string;
            if (index != 0) html_string = '<option id="' + element + '" value="' + element + '">' + element + '</option>';
            else {
                html_string = '<option id="' + element + '" value="' + element + '" selected>' + element + '</option>';
            }
            pubInput.innerHTML += html_string;
        }
    });
}

function increase_us(is_tab2 = false) {
    if(is_tab2){
        uygulama_sayisi_tab2 += 1;
        document.getElementById("usInput_tab2").value = uygulama_sayisi_tab2.toString() + ". Uygulama";
    }
    else{
        uygulama_sayisi += 1;
        document.getElementById("usInput").value = uygulama_sayisi.toString() + ". Uygulama";
    }
}

function decrease_us(is_tab2 = false) {
    if(is_tab2){
        if (uygulama_sayisi_tab2 == 1) return;

        uygulama_sayisi_tab2 -= 1;
        document.getElementById("usInput_tab2").value = uygulama_sayisi_tab2.toString() + ". Uygulama";
    }
    else{
        if (uygulama_sayisi == 1) return;

        uygulama_sayisi -= 1;
        document.getElementById("usInput").value = uygulama_sayisi.toString() + ". Uygulama";
    }    
}

async function tab1_calculate() {
    let should_calculate = true;
    let yaInput = document.getElementById("yaInput");
    let msInput = document.getElementById("msInput");
    let pubInput = document.getElementById("pubInput");
    let ygInput = document.getElementById("ygInput");
    let tsInput = document.getElementById("tsInput");
    let temelInput = document.getElementById("temelInput");

    let inputs = [yaInput, msInput, pubInput, ygInput, tsInput, temelInput];

    let YSK, BM, PUO, PYK, HB, BK;
    // YSK : Yapı Sınıfı Katsayısı
    // BM : Birim Maliyet
    // PUO : Proje Ücret Oranı
    // IMHO : İnşaat Mühendisliği Hizmet Oranı
    // PYK : Proje Yineleme Katsayısı
    // HB : Hizmet Bölümleri
    // BK : Bölge Katsayısı

    let ysk_puani = 0;
    let YA = parseInt(yaInput.value); // Yapı Alanı
    let IMHO = 0.75;

    //* Highlight the input as red if empty.
    for (let index = 0; index < inputs.length; index++) {
        const input_element = inputs[index];

        if (input_element.value == "empty") {
            input_element.classList.add("border-3", "border-danger");
            should_calculate = false;
        }
        else input_element.classList.remove("border-3", "border-danger");
    }

    if (Number.isNaN(YA) || YA < 0) {
        yaInput.classList.add("border-3", "border-danger");
        should_calculate = false;
    }
    else {
        yaInput.classList.remove("border-3", "border-danger");
    }

    if (should_calculate) {

        //* Calculate BM
        let ygInput_0 = ygInput.value[0];
        let ygInput_1 = ygInput.value[1];
        await fetch("./data/tablo1.json").then((response) => response.json()).then((tablo1_data) => {
            BM = tablo1_data[ygInput_0 + ". sinif yapilar"][ygInput_1];
        });

        //* Calculate YSK
        await fetch("./data/tablo2.json").then((response) => response.json()).then((tablo2_data) => {
            ysk_puani += tablo2_data["tasiyici sistem yapisi"][tsInput.value];
        });
        await fetch("./data/tablo2.json").then((response) => response.json()).then((tablo2_data) => {
            ysk_puani += tablo2_data["temel sistemi"][temelInput.value];
        });
        await fetch("./data/tablo3.json").then((response) => response.json()).then((tablo3_data) => {
            YSK = tablo3_data[ysk_puani];
        });

        //* Calculate PUO
        await fetch("./data/tablo4.csv").then((response) => response.text()).then((tablo4_data) => {
            tablo4_data = tablo4_data.split("\n");
            tablo4_data.shift();

            if (YA >= 80000) {
                const pricing_row = [80000, 0.67, 0.75, 0.83, 0.92, 1.00];
                PUO = parseFloat(pricing_row[parseInt(ygInput.value[0])]) / 100;
            }
            else {
                for (let index = 0; index < tablo4_data.length; index++) {
                    const tablo4_row = tablo4_data[index].split(",");

                    if (parseInt(tablo4_row[0]) > YA) {
                        const pricing_row = tablo4_data[index - 1].split(",");
                        PUO = parseFloat(pricing_row[parseInt(ygInput.value[0])]) / 100;
                        break;
                    }
                }
            }
        });

        //* Calculate PYK
        await fetch("./data/tablo5.json").then((response) => response.json()).then((tablo5_data) => {
            let result = 0;
            for (let index = 1; index <= uygulama_sayisi; index++) {
                let k;
                if (index <= 4) k = index.toString();
                else k = ">4";

                result += tablo5_data[k];
            }
            PYK = parseFloat(result.toPrecision(3));
        });

        //* Calculate HB
        await fetch("./data/tablo6.json").then((response) => response.json()).then((tablo6_data) => {
            if (document.getElementById("yeni proje").checked) {
                // get the checkboxes
                let checkboxes = document.querySelectorAll("#yeni_proje_checkbox_div input[type='checkbox']:checked");
                let result = 0;
                for (let index = 0; index < checkboxes.length; index++) {
                    const checkbox = checkboxes[index];
                    result += tablo6_data[checkbox.value];
                }
                HB = result;
            }
            else {
                let selected_value = document.querySelector('input[name="options"]:checked').value;
                HB = tablo6_data[selected_value];
            }
        });

        //* Calculate BK
        await fetch("./data/tablo8.json").then((response) => response.json()).then((tablo8_data) => {
            BK = tablo8_data[msInput.value][pubInput.value];
        });

        PUO = parseFloat(PUO.toPrecision(4));
        let result = YA * BM * YSK * PUO * IMHO * PYK * HB * BK;
        // result = parseFloat(result.toPrecision(3));

        //* Log the calculation to the console
        const debug_log = {
            "BM": BM,
            "YSK": YSK,
            "PUO": PUO,
            "PYK": PYK,
            "HB": HB,
            "BK": BK
        };
        console.table(debug_log);
        let _result = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(result);
        console.info("Sonuç", _result);

        if(document.getElementById("yeni proje").checked == false) display_result(result);
        else display_result(result / HB);
    }
}

async function tab2_calculate(){
    let YA, BM, HBK, PYK;
    // YA : Yapı Alanı
    // BM : Birim Maliyet
    // HBK : Hizmet Bedeli Katsayısı
    // PYK : Proje Yineleme Katsayısı

    let should_calculate = true;
    let yaInput = document.getElementById("yaInput_tab2");
    let ygInput = document.getElementById("ygInput_tab2");

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

    if(should_calculate){
        //* Calculate BM
        let ygInput_0 = ygInput.value[0];
        let ygInput_1 = ygInput.value[1];
        await fetch("./data/tablo1.json").then((response) => response.json()).then((tablo1_data) => {
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
                if(existing_YA_values.includes(YA)){ // no need for interpolation, data already exists.
                    for (let index = 0; index < data.length; index++) {
                        const row = data[index].split(",");
                        if (parseInt(row[0]) == YA) {
                            const reference_row = data[index].split(",");
                            HBK = parseFloat(reference_row[1]) / 1000;
                            break;
                        }
                    }
                }
                else{ // use linear interpolation
                    for (let index = 0; index < data.length; index++) {
                        const row = data[index].split(",");
    
                        if (parseInt(row[0]) > YA) {
                            const reference_row1 = data[index - 1].split(",");
                            const reference_row2 = data[index].split(",");

                            HBK = (linear_interpolation(
                                [parseInt(reference_row1[0]),parseFloat(reference_row1[1])],
                                [parseInt(reference_row2[0]),parseFloat(reference_row2[1])],
                                YA
                            )) / 1000;
                            break;
                        }
                    }
                }
            }
        });

        //* Calculate PYK
        await fetch("./data/tablo5.json").then((response) => response.json()).then((tablo5_data) => {
            let result = 0;
            for (let index = 1; index <= uygulama_sayisi_tab2; index++) {
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
            "HBK" : HBK,
            "BM": BM,
            "PYK": PYK,
        };
        console.table(debug_log);
        console.info(_result);

        //* Display the result on UI
        document.getElementById("resultDiv_tab2").replaceChildren();
        let p = document.createElement("p");
        p.innerHTML = "Mesleki Denetim Hizmet Bedeli Ücreti: " + _result;
        p.className = "text-center mt-4 fs-5";
        document.getElementById("resultDiv_tab2").appendChild(p);

        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth"
          });
    }
}

async function display_result(result){
    //* If the project type is "yeni proje", a table will be displayed.
    //* Otherwise, just a text will be displayed.
    //* This is why the if statement is needed.

    document.getElementById("resultDiv").replaceChildren();

    if(document.getElementById("yeni proje").checked){
        
        document.getElementById("resultDiv").innerHTML+= `
            <div class="table-responsive mt-4">
                <table class="table">
                    <thead class="table-light">
                        <tr>
                            <th scope="col">Proje</th>
                            <th scope="col" class="text-end">Ücret</th>
                        </tr>
                    </thead>
                    <tbody>
                        
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>Toplam Yeni Proje Ücreti</th>
                            <th class="text-end"></th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        let selected_checkboxes = document.querySelectorAll("#yeni_proje_checkbox_div input[type='checkbox']:checked");
        let total_price = 0;

        await fetch("./data/tablo6.json").then((response) => response.json()).then((tablo6_data) => {
            for (let index = 0; index < selected_checkboxes.length; index++) {
                const sc = selected_checkboxes[index]; // sc = selected checkbox
                let tsv = result * tablo6_data[sc.value]; // tsv = this service's value
                let _tsv = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(tsv);
                document.querySelector("table tbody").innerHTML += `
                    <tr>
                        <td>`+document.querySelector("label[for='"+ sc.id +"']").innerHTML+`</td>
                        <td class="text-end">`+_tsv+`</td>
                    </tr>
                `;
                total_price += tsv;
            }
        });
        let _total_price = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(total_price);
        document.querySelector("table tfoot tr th.text-end").innerHTML += _total_price;

    }
    else{
        let _result = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(result);
        const sr = document.querySelector('input[name="options"]:checked').id; // sr = selected radiobutton
        const label = document.querySelector("label[for='"+sr+"']").innerHTML;
        let p = document.createElement("p");
        p.innerHTML = label + " Ücreti: " + _result;
        p.className = "text-center mt-4 fs-5";
        document.getElementById("resultDiv").appendChild(p);
    }

    window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth"
      });
}

/** if a checkbox is selected, 
 * automatically deselect all the other radio buttons except "Yeni Proje". */
function select_yeni_proje_radiobutton() {
    if (document.querySelector("input[type='radio']").checked) return;

    for (let index = 0; index < document.querySelectorAll("input[type='radio']").length; index++) {
        const radio_element = document.querySelectorAll("input[type='radio']")[index];
        radio_element.checked = false;
    }
    document.querySelector("input[type='radio']").checked = true;
}

/** if a radio button other than "Yeni Proje" is selected,
 * all the checkboxes under "Yeni Proje" should be deselected
 */
function deselect_checkboxes() {
    for (let index = 0; index < document.querySelectorAll("input[type='checkbox']").length; index++) {
        const radio_element = document.querySelectorAll("input[type='checkbox']")[index];
        radio_element.checked = false;
    }
}

/**
 * point1 = [x1, y1]
 * 
 * point2 = [x2, y2]
 * 
 * x = the x value between x1 and x2
 */
function linear_interpolation(point1, point2, x){
    let diff_x = point1[0] - point2[0];
    let diff_y = point1[1] - point2[1];
    return point1[1] + ((x - point1[0]) * diff_y / diff_x);
}