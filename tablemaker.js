const e = require("express");
const db = require("./database")
var onetwo = function(code) {
    return new Promise(function(resolve, reject) {
        let returning;
        db.query('USE subejects;');
        db.query('SELECT name from subject_1 WHERE id=?;', [code],
            function(error, results) {
                if (!error) {
                    if (results.length > 0) {
                        returning = 1;
                    } else {
                        returning = 2;
                    }
                }
            })
        resolve(returning);
    })

}
exports.status = function(email, classcodearr) { //현재 이수상태 저장
    return new Promise(function(resolve, reject) {
        var current = 0; //현재 이수학점
        var current_major_basic = 0; //현재 이수 전공기초학점
        var current_major_must = 0; //현재 이수 전공필수학점
        var curr_major_select = 0; //현재 이수 전공선택학점
        var curr_etc_must = 0; //현재 이수 필수교양학점
        var curr_etc_select = 0; //현재 이수 선택교양학점
        var ethics = 0; //품성교양
        var language = 0; //언어교양
        var humanities = 0; //인문학교양
        var socialstudy = 0; //사회과학교양
        var christian = 0; //기독교과목
        var semester = 0;
        for (var i = 0; i < classcodearr.length; i++) {
            dbsearchclass(classcodearr[i]).then(
                function(result) {
                    current += parseInt(result[0].unit);
                    //전공 및 교양 필수/선택 체크
                    if (result[0].division.includes("전기")) {
                        current_major_basic += result[0].unit;
                    } else if (result[0].division.includes("전필")) {
                        current_major_must += result[0].unit;
                    } else if (result[0].division.includes("전선")) {
                        curr_major_select += result[0].unit;
                    } else if (result[0].division.includes("교필")) {
                        curr_etc_must += result[0].unit;
                    } else if (result[0].division.includes("교선")) {
                        //교선 분야 확인
                        if (result[0].etc_div.includes('사회과학')) {
                            socialstudy = 1
                        } else if (result[0].etc_div.includes('국제어문')) {
                            language = 1;
                        } else if (result[0].etc_iv.includes('인문학')) {
                            humanities = 1;
                        } else if (result[0].etc_idv.includes('숭실품성')) {
                            ethics = 1;
                        }
                        curr_etc_select += result[0].unit;
                    }
                    return [classcodearr[i], result]
                }
            ).then(function(resresult) {
                onetwo(resresult[0]).then(
                    function(sem) {
                        if (resresult[1].targetstudent.includes('1학년')) {
                            if (sem === 1) {
                                if (semester < 1) {
                                    semester = 1;
                                }
                            } else if (semester < 2) {
                                semester = 2;
                            }
                        } else if (resresult[1].targetstudent.includes('2학년')) {
                            if (sem === 1) {
                                if (semester < 3) {
                                    semester = 3;
                                }
                            } else if (semester < 4) {
                                semester = 4;
                            }
                        } else if (result[1].targetstudent.includes('3학년')) {
                            if (sem === 1) {
                                if (semester < 5) {
                                    semester = 5;
                                }
                            } else if (semester < 6) {
                                semester = 6;
                            }
                        }
                    }
                );
            });
        }
        resolve([current, current_major_basic, current_major_must, curr_major_select, curr_etc_must, curr_etc_select, ethics, language, humanities, socialstudy, semester])
    });
}

const graduation_unit = 133; //졸업학점
const graduation_major_select = 51;
const graduation_major_basic = 18; //전공기초
const graduation_major_must = 15; //전공필수
const graduation_etc_must = 14; //교양필수
const graduation_etc_selection = 20; //교양선택
const graduation_major_without_basic = 66; //전공기초 제외 전공 요학점
const graduation_christ = 4;
exports.planmake = function(email) {
    return new Promise(function(resolve, reject) {
        getinfofromusers(email).then(
            function(email,data) {
                var needed = {
                    "unit_needed": graduation_unit - data[stats].unit_attended,
                    "major_must": graduation_major_must - data[stats].current_major_must,
                    "major_basic": graduation_major_basic - data[stats].current_major_basic,
                    "major_select": graduation_major_select - data[stats].curr_major_select,
                    "etc_must": graduation_etc_must - data[stats].curr_etc_must,
                    "etc_select": graduation_etc_selection - data[stats].curr_etc_select
                };
                data['needed'] = needed;
                return (email,data);
            }
        ).then(
            function(email,dats) {
                let currsem = data[stats].semester+1;
                db.query('USE subjects;');
                while(currsem<9)
                {
                    var max = 18;
                    var major_must = 0; //전공필수
                    var etc_must = 0; //교양필수
                    if (currsem / 2 <= 1) { //1학년때
                        max = 22;
                        major_must = 9; //1학년전기,전필
                        etc_must; //1학년교필
                    } 
                    else if (currsem == 3) { //2학년 1학기
                        etc_must = 2;
                        major_must = 3;
                    } 
                    else if (currsem === 4) {
                        major_must = 6;
                    } 
                    else if (currsem / 2 <= 6) { //3학년
                        major_must = 3;
                    }
                    if(currsem%2===1){//1학기
                        if(currsem===1)
                        {
                            db.query('SELECT name,id from subject_1 WHERE division=전기-?',dats[stats].major,
                            function(error,result,fields){
                                if(!error){
                                    if(result.length>0){
                                        codeconnection(result).then(function(resultstring){
                                            db.query('SELECT one from semesters WHERE EMAIL=?',email,
                                            function(error,results,fields){
                                                if(!error){
                                                    if(results.length>0){
                                                        resultstring+=results[0].one;
                                                    }
                                                }
                                                
                                            })
                                            return(resultstring)
                                        }).then(
                                            function(resultstring){
                                                db.query('USE gracurri_user;');
                                                db.query('UPDATE semesters SET one=? WHERE EMAIL=?',[resultstring,email]);
                                            }
                                        )
                                    }
                                }
                            })
                        }
                        db.query('SELECT name,id from subject_1 WHERE division=전필-? and targetstudent LIKE'+db.escape("%"+String(parseInt(currsem/2))+"%"),
                        function(error,result,fields){
                            if(!error){
                                if(result.length>0){
                                    codeconnection(result).then(
                                        function(resultstring){
                                            db.query("USE gracurri_user;");
                                            if(currsem===1){
                                                SELECT
                                            }
                                            else if(currsem===3){

                                            }
                                            else if(currsem===5){

                                            }
                                            else if(currsem===7){

                                            }
                                        }
                                    )
                                }
                            }
                        })
                    }
                    else{
                        if(currsem===2)
                        {
                            db.query('SELECT name,id from subject WHERE division=전기-?',dats[stats].major,
                            function(error,result,fields){
                                if(!error){
                                    if(result.length>0){
                                        codeconnection(result).then(
                                            function(resultstring){
                                                db.query('USE gracurri_user;');
                                                db.query('UPDATE semesters SET two=?',temcodes);
                                            }
                                        )
                                    }
                                }
                            })
                        }

                    }
                    currsem+=1;
                }
            }
        )
        result = {
            "code": 200,
            "success": "successed"
        }
        resolve(result);
    })
}
var getinfofromusers = function(email) { //users에 저장되어있는 학점이수정보,들은 과목 정보 불러오기 =>planmake에서 씀
    return new Promise(function(resolve, reject) {
        let returningdata={};
        db.query('USE gracurri_user;');
        db.query('SELECT unit_attended,major_basic,major_must,major_select,etc_must,etc_select,ethics,language,humanities,socialstudy,semester,major FROM users WHERE EMAIL=?', [email],
            function(error, results, fields) {
                if (!error) {
                    returningdata[stats]= results[0];
                    if(returningdata[stats].major==='computer'){
                        returningdata[stats].major='컴퓨터';
                    }
                    else{
                        returningdata[stats].major='글로벌미디어';
                    }
                }
            });
        db.query('SELECT classcodes FROM users_classes_attended WHERE EMAIL=?', [email],
            function(error, results, fields) {
                if (!error) {
                    let classcode=[];
                    if(results.length>0){
                        for(var i=0;i<results[0].classcodes.length;i+=10){
                            var temp=results[0].classcodes.slice(i,i+10);
                            classcode.push(temp);
                        }
                    }
                    returningdata[codesattended] = classcode;
                }
            })
        resolve(email,returningdata);
    })
}
var codeconnection=function(coderesults){ //과목번호들 이어붙여서 하나의 스트리으로 리턴
    return new Promise(function(resolve,reject){
        var temcodes='';
        for(var i=0;i<coderesults.length;i++){
            temcodes+=coderesults[i].id;
        }
        resolve(temcodes);
    })
}