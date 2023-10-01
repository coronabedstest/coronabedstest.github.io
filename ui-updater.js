var gnctd_init = function() {

var _SZ = function(s) {
    if (s[0] == '0') {
        return '&nbsp;' + s.slice(1);
    }
    return s;
};
var _o2_left = function(hospital) {
    if (!gnctd_covid_data['oxygen_left_for']) {
        return '';
    }
    var d = gnctd_covid_data['oxygen_left_for'][hospital];
    if (!d) {
        return '';
    }
    var label = '';
    var days = d['days'];
    if (days) {
        label += (days + ' day');
        if (days>1) {
            label += 's';
        }
        label += ' ';
    }
    var hours = d['hours'];
    if (hours) {
        label += (hours + ' hour');
        if (hours>1) {
            label += 's';
        }
    }
    return label;
};
var _sorted = function(d, field, facilities, ascending) {
    var FACILITY_TYPE_WEIGHTS = {
        'Hospital': 70000,
        'Covid Care Centre': 50000,
        'Covid Health Centre': 20000,
        null: 0,
    };
    var weightage = function(data, hospital_name) {
        var group_weight = 0;
        if ((data['type']=='Govt')||(data['type']&&data['type'].includes('Government'))) {
            group_weight = 500000;
        }
        else {
            group_weight = data['type']?200000:0;
        }
        //console.log('"'+hospital_name+'"');
        if (facilities[hospital_name]) {
            var facility_type = facilities[hospital_name]['facility_type'];
            group_weight += FACILITY_TYPE_WEIGHTS[facility_type];
        }
        return group_weight+data[field];
    };
    var items = Object.keys(d).map(function(key) {
        return [key, d[key]];
    });
    items.sort(function(a,b) {
        return (ascending?1:-1)*(weightage(a[1],a[0]) - weightage(b[1],b[0]));
    });
    return items;
};
$(document).ready(function(){
    $('#page_title').text(GNCTD_TITLE);
    document.title = GNCTD_TITLE + ' - Delhi Government';
    $('.vacancy_threshold').text(GNCTD_VACANCY_THRESHOLD);
    var facilities = gnctd_covid_facilities_data;
    var units = gnctd_covid_data[GNCTD_UNIT_TYPE];
    var i = 1;
    var table = '';

    var add_row = function(hospital, data) {
        if (hospital!='All') {
            var details = facilities[hospital];

            //var alt_row_class = (i%2==0)?'class="table-primary"':'';
            var alt_row_class = '';
            if (data['total']) {
                var vacancy = data['vacant'];
                if (vacancy == 0) {
                    alt_row_class = 'table-danger';
                }
                else if (vacancy < GNCTD_VACANCY_THRESHOLD) {
                    alt_row_class = 'table-warning';
                }
                else {
                    alt_row_class = 'table-success';
                }
            }
            var type_class = ((data['type']=='Govt')||(data['type']&&data['type'].includes('Government'))) ? 'badge-dark' : 'badge-secondary';
            var contact_number = details ? (details['contact_numbers'] ? details['contact_numbers'][0] : null) : null;
            table += '<tr class="' + alt_row_class + '">' +
                '<th scope="row" class="text-left"><a target="_blank" href="' + (details?details['location']:'') + '"><i data-feather="map-pin"></i></a> ' +
                  '<a data-toggle="collapse" href="#collapse' + i + '" role="button" aria-expanded="false" aria-controls="collapse' + i + '">' + '<i data-feather="info"></i> <span class="badge badge-sm ' + type_class + '">' + (details ? details['type'] : data['type']) + '</span> ' + (details ? ((details['facility_type']!='Hospital')?'<span class="badge badge-light">'+ details['facility_type'] +'</span> ':''):'') + hospital + '</a> </th>' + 
              '<td><small><a data-toggle="collapse" href="#collapse' + i + '" role="button" aria-expanded="false" aria-controls="collapse' + i + '">' + _SZ(data['last_updated_at']) + '</a></small></td>' + 
              '<td><a data-toggle="collapse" href="#collapse' + i + '" role="button" aria-expanded="false" aria-controls="collapse' + i + '">' + data['total'] + '</a></td>' + 
              '<td><a data-toggle="collapse" href="#collapse' + i + '" role="button" aria-expanded="false" aria-controls="collapse' + i + '">' + Math.max(0,data['total']-data['vacant'])+ '</a></td>' + 
              '<td><a data-toggle="collapse" href="#collapse' + i + '" role="button" aria-expanded="false" aria-controls="collapse' + i + '">' + data['vacant'] + '<br /><br />' + (contact_number ? '<a data-toggle="collapse" class="badge badge-pill badge-success" href="#collapse' + i + '"><i data-feather="phone" style="width:16px;"></i> Contact</a>': '') + '</a></td>' + 
              '<td><small><a data-toggle="collapse" href="#collapse' + i + '" role="button" aria-expanded="false" aria-controls="collapse' + i + '">' + _o2_left(hospital) + '</a></small></td>' + 
            '</tr>';
            if (details) {
                var contact_numbers_row = '';
                var contact_numbers = details['contact_numbers'];
                if (contact_numbers.length) {
                    contact_numbers_row = '<li class="list-group-item"> ' + (contact_numbers.length?'Tap to call: ':'');
                    for (var j=0; j < contact_numbers.length; ++j) {
                        contact_numbers_row += ' <a class="badge badge-pill badge-success" href="tel:' + contact_numbers[j] + '"><i data-feather="phone"></i> ' + contact_numbers[j] +' </a>';
                    }
                    contact_numbers_row += '</li>';
                }
                table += '<tr class="text-left collapse" id="collapse' + i + '"><td colspan="5">' +
                 '<div class="card shadow m-1 mb-2">' +
                  '<div class="card-body">' +
                    '<h5 class="card-title">' + hospital + '</h5>' +
                    '<p class="card-text">' + details['address'] + '</p>' +
                  '</div>' +
                  '<ul class="list-group list-group-flush">' +
                    '<li class="list-group-item">Management: ' + details['type'] + '</li>' +
                    contact_numbers_row +
                  '</ul>' +
                  '<div class="card-body">' +
                    '<a href="' + details['location'] + '" class="card-link" target="_blank"><i data-feather="map-pin"></i> View Location in Maps</a>' +
                  '</div>' +
                 '</div></td></tr>';
            }

            i++;
        }
    };
    var sorted_units = _sorted(units, 'total', facilities);
    $.each(sorted_units, function(i, hospital_and_data) {
        add_row(hospital_and_data[0], hospital_and_data[1]);
    });
    var total = units['All'];
    table += '<tr class="bg-dark text-white">' +
          '<th scope="row">Total</th>' +
          '<td></td>' +
          '<td>' + total['total'] + '</td>' +
          '<td>' + (total['total']-total['vacant']) + '</td>' +
          '<td>' + total['vacant'] + '</td>' +
          '<td></td>';
        '</tr>';
    $('#hospitals_list').empty();
    $('#hospitals_list').append(table);

    var other_notes = '';
    $.each(gnctd_covid_data['notes'], function(index, value) {
        other_notes += value + '\<br />';
    });
    $('#other_notes').append(other_notes);

    feather.replace();

    $('#last_updated_at').text(gnctd_covid_data['last_updated_at']);
});

};
gnctd_init();
