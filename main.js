let msInput_selected_value;
let pubInput_selected_value;
let ygInput_selected_value;
let tablo8_data;
let tsInput_selected_value;
let temelInput_selected_value;
let uygulama_sayisi = 1;
let hb_selected_values = [];

fetch("./data/tablo8.json").then((response) => response.json()).then((data) => {
    tablo8_data = data;
    retrive_msInput_options(data);
});

function retrive_msInput_options(data){
    let msInput = document.getElementById("msInput");

    for (let index = 0; index < Object.keys(data).length; index++) {
        const city_name = Object.keys(data)[index];
        msInput.innerHTML += '<option id="'+city_name+'" value="'+city_name+'">'+city_name+'</option>';
    }
}

function msInput_selected(selected_value){
    msInput_selected_value = selected_value;

    let pubInput = document.getElementById("pubInput");
    pubInput.innerHTML = "";

    //* retrieve the options for pubInput
    for (let index = 0; index < Object.keys(tablo8_data[selected_value]).length; index++) {
        const element = Object.keys(tablo8_data[selected_value])[index];
        let html_string;
        if(index != 0) html_string = '<option id="'+element+'" value="'+element+'">'+element+'</option>';
        else{
            html_string = '<option id="'+element+'" value="'+element+'" selected>'+element+'</option>';
            pubInput_selected_value = element;
        }
        pubInput.innerHTML += html_string;
    }
}

function increase_us(){
    uygulama_sayisi += 1;
    document.getElementById("usInput").value = uygulama_sayisi.toString() + ". Uygulama";
}

function decrease_us(){
    if(uygulama_sayisi == 1) return;

    uygulama_sayisi -= 1;
    document.getElementById("usInput").value = uygulama_sayisi.toString() + ". Uygulama";
}

function hb_item_pressed(element){
    if(element.checked){
        hb_selected_values.push(element.value);
    }
    else{
        hb_selected_values = hb_selected_values.filter(item => item !== element.value);
    }
}