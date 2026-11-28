// 추정: 실제 검사의 문항·배점·성향 분류는 비공개다. 아래는 guide.html의 여덟 기준으로 새로 쓴 연습 문항이다.
(function (root) {
  'use strict';

  const dimensions = [
    { id: 'contact', name: '첫 대화', low: '상대가 말 걸기를 기다림', high: '먼저 말을 검' },
    { id: 'novelty', name: '새로운 일', low: '익숙한 일을 선호', high: '새로운 일을 선호' },
    { id: 'planning', name: '일의 순서', low: '그때그때 결정', high: '미리 계획' },
    { id: 'disclosure', name: '실수 대처', low: '먼저 혼자 수습', high: '먼저 알림' },
    { id: 'conflict', name: '갈등 대처', low: '대화를 피함', high: '대화로 풀어 감' },
    { id: 'procedure', name: '일 처리 기준', low: '상황에 맞춰 조정', high: '정해진 절차 우선' },
    { id: 'team', name: '작업 방식', low: '혼자 하는 편이 편함', high: '함께 하는 편이 편함' },
    { id: 'pressure', name: '압박을 느낄 때', low: '불안해짐', high: '차분함을 유지' }
  ];

  // 각 줄은 같은 상황의 기준 문장, 같은 방향의 바꿔 쓴 문장, 반대 방향 문장이다.
  // 첫 두 문장의 방향이 +1이면 동의할수록 그 차원의 high 쪽이다. 어느 쪽도 정답을 뜻하지 않는다.
  const wording = {
    contact: [
      [1, '처음 짝이 된 사람에게는 내가 먼저 인사를 건넨다.', '처음 만난 짝과의 첫인사는 보통 내가 시작한다.', '처음 짝을 만나면 그 사람이 먼저 인사하기를 기다린다.'],
      [-1, '낯선 사람이 옆자리에 앉으면 말을 걸어 올 때까지 내 일을 한다.', '옆자리에 처음 보는 사람이 있으면 상대가 대화를 시작하는 편이다.', '옆자리에 처음 보는 사람이 오면 내가 먼저 말을 붙인다.'],
      [1, '새 모임에서 모르는 사람과 마주치면 내가 먼저 이름을 묻는다.', '처음 간 모임에서는 낯선 사람에게 내가 먼저 자기소개를 청한다.', '새 모임에서는 모르는 사람이 먼저 자기소개를 할 때까지 기다린다.'],
      [-1, '처음 보는 동료와 쉬는 시간이 겹치면 그쪽에서 말을 꺼내기를 기다린다.', '잘 모르는 동료와 단둘이 쉬게 되면 먼저 말을 붙이지 않는 편이다.', '처음 보는 동료와 단둘이 쉬게 되면 내가 먼저 이야깃거리를 꺼낸다.'],
      [1, '함께 일하게 된 새 팀원에게 내가 먼저 짧은 안부를 묻는다.', '새로 온 팀원과의 첫 안부 인사는 내가 먼저 건네는 편이다.', '새 팀원이 먼저 말을 걸어 온 뒤에야 안부를 나눈다.'],
      [-1, '첫 온라인 모임에서는 모르는 참가자가 말을 꺼낸 뒤에 대화에 낀다.', '처음 여럿이 만나는 온라인 자리에서는 다른 사람이 말문을 연 뒤에야 입을 연다.', '처음 보는 사람들과 온라인으로 모이면 내가 먼저 이야기를 시작한다.'],
      [1, '처음 보는 사람과 둘만 남으면 내가 먼저 가벼운 질문을 한다.', '낯선 사람과 단둘이 있을 때는 보통 내가 질문을 건네 대화를 연다.', '낯선 사람과 둘만 있으면 상대의 첫 질문을 기다리는 편이다.']
    ],
    novelty: [
      [1, '난이도가 비슷하다면 아직 해 보지 않은 역할을 맡고 싶다.', '같은 정도로 해낼 수 있는 일 중에서는 처음 맡는 역할이 더 끌린다.', '난이도가 같다면 전에도 해 본 역할을 맡는 편이 좋다.'],
      [-1, '성능이 같은 도구 중 고를 때에는 손에 익은 쪽이 좋다.', '할 수 있는 일이 같으면 이미 써 본 도구를 더 자주 고른다.', '성능이 같은 도구라면 써 보지 않은 쪽을 고르고 싶다.'],
      [1, '선택 교육에서는 잘 아는 주제보다 낯선 분야를 먼저 둘러본다.', '교육 주제를 직접 고를 때면 처음 접하는 분야 쪽으로 마음이 간다.', '선택 교육이라면 모르는 주제보다 익숙한 분야를 더 듣고 싶다.'],
      [-1, '업무가 바뀌는 주보다 하던 일을 이어 가는 주가 더 반갑다.', '새 일이 시작되는 주보다 지난주 일을 이어 하는 주를 더 기다린다.', '계속 같은 일을 하는 주보다 새로운 업무가 시작되는 주가 더 기다려진다.'],
      [1, '취미 모임을 고를 때면 해 본 적 없는 활동이 눈에 들어온다.', '취미를 고를 기회가 생기면 익숙한 활동보다 새로운 활동을 해 보고 싶다.', '취미 모임에서는 새 활동보다 전에도 해 본 활동이 반갑다.'],
      [-1, '두 업무의 부담이 같다면 경험이 있는 분야에 남고 싶다.', '부담이 비슷한 업무를 고를 때에는 낯선 분야보다 익숙한 분야에 손이 간다.', '부담이 같은 두 업무라면 경험이 적은 분야로 옮겨 보고 싶다.'],
      [1, '시범 수업을 하나 들을 수 있다면 처음 접하는 주제를 고른다.', '체험 수업에서는 이미 아는 것보다 새로운 주제를 만나고 싶다.', '시범 수업이라면 처음 접하는 주제보다 익숙한 주제를 고른다.']
    ],
    planning: [
      [1, '할 일이 여럿인 날에는 시작 전에 처리 순서를 정한다.', '하루에 여러 일을 할 때는 무엇부터 할지 먼저 정해 둔다.', '할 일이 여러 개여도 하나를 끝낼 때마다 다음 일을 고른다.'],
      [-1, '여유 있는 휴일에는 어디 갈지를 당일에 정하는 편이 좋다.', '시간이 넉넉한 휴일 나들이는 그날 정하는 쪽이 마음에 든다.', '여유 있는 휴일에도 나들이 장소는 미리 정해 두는 편이 좋다.'],
      [1, '하루가 걸릴 작업은 어느 시점까지 무엇을 할지 먼저 잡아 둔다.', '하루짜리 작업에 들어가기 전에 중간에 어디까지 진행할지 정해 둔다.', '하루가 걸리는 작업에서도 중간 목표는 진행하면서 잡는 편이다.'],
      [-1, '발표 연습을 할 때에는 할 말을 해 보면서 순서를 잡는다.', '발표 연습은 말하는 도중에 순서를 정하는 쪽이 편하다.', '발표 연습을 하기 전에 말할 순서를 먼저 짜 둔다.'],
      [1, '일주일 동안 나눠 할 일은 어느 날 할지 미리 정해 두면 마음이 놓인다.', '한 주의 일을 날짜별로 나눠 두어야 안심이 된다.', '한 주의 일은 그날그날 골라서 하는 쪽이 마음 편하다.'],
      [-1, '처음 가는 동네에서는 현장에서 걷고 싶은 경로를 정한다.', '낯선 동네를 둘러볼 때는 도착한 뒤 발길 닿는 길을 고른다.', '처음 가는 동네를 둘러볼 때에는 걸을 경로를 미리 잡는다.'],
      [1, '여러 가게에 들러야 할 때에는 출발 전에 들를 순서를 정한다.', '볼일 볼 곳이 여러 군데면 움직이기 전에 순서부터 잡는다.', '여러 곳에 볼일이 있어도 어디부터 갈지는 나가서 결정한다.']
    ],
    disclosure: [
      [1, '내가 공유한 표에서 오류를 발견하면 고치기 전에 같이 쓰는 사람에게 알린다.', '여럿이 보는 표에 내가 틀리게 쓴 값이 있으면 먼저 그 사실을 전한다.', '공유한 표에 내가 낸 오류가 있으면 동료에게 말하기 전에 혼자 바로잡는다.'],
      [-1, '함께 쓰는 자료를 잘못 정리하면 먼저 혼자 되돌려 보려 한다.', '공동 자료 정리를 잘못했을 때에는 복구를 시도한 다음에야 상황을 알린다.', '공동 자료를 잘못 정리한 것을 알면 복구를 시도하기 전에 동료에게 이야기한다.'],
      [1, '공동 일정에 시간을 잘못 적었다는 걸 알아차리면 바로 관계자에게 말한다.', '함께 쓸 일정의 시간이 내 실수로 틀렸다면 수정을 시작하기 전에 알린다.', '내가 공동 일정에 시간을 잘못 적으면 사람들에게 알리기 전에 직접 고친다.'],
      [-1, '내 설명에 빠진 내용이 있으면 우선 혼자 보완하고 나서 듣던 사람에게 말한다.', '내가 빼먹고 설명한 부분은 보완 방법을 마련한 뒤에 듣던 사람에게 알린다.', '내 설명에서 중요한 부분을 빼먹었다면 보완하기 전에 듣던 사람에게 먼저 알린다.'],
      [1, '내가 잘못 전달한 파일을 발견하면 교체하기 전 먼저 받는 사람에게 알려 준다.', '파일을 잘못 보냈다는 걸 알아차리면 새 파일을 준비하기에 앞서 상대에게 말한다.', '파일을 잘못 보냈다면 상대에게 말하기 전에 올바른 파일부터 준비해 둔다.'],
      [-1, '함께 세는 물품 수를 내가 틀렸다면 말하기 전에 혼자 다시 세어 본다.', '공동 집계에서 내 실수를 발견하면 먼저 재확인하고 나서 팀에 알린다.', '공동 집계에서 내가 수를 잘못 셌음을 알면 다시 세기 전에 팀에 알린다.'],
      [1, '넘겨준 목록에서 내가 한 줄을 빠뜨렸다면 고치기 전에 인수자에게 바로 이야기한다.', '인계 목록을 내가 빠뜨려 썼다는 걸 알면 우선 인수자에게 알린다.', '인계 목록에 내가 누락한 줄이 있으면 인수자에게 말하기 전에 직접 채워 넣는다.']
    ],
    conflict: [
      [1, '동료와 생각이 부딪히면 그 사람과 따로 이야기할 자리를 청한다.', '동료와 의견 충돌이 있으면 직접 이야기를 나눌 기회를 만든다.', '동료와 생각이 부딪히면 그 문제로 따로 대화하는 자리를 피한다.'],
      [-1, '작은 말다툼 뒤에는 그 일을 다시 꺼내지 않는 편이다.', '가벼운 언쟁은 당사자와 되짚어 말하지 않고 지나가는 쪽을 택한다.', '작은 말다툼이 있었으면 당사자와 다시 이야기해서 풀어 보는 편이다.'],
      [1, '역할 분담을 두고 다툼이 생기면 당사자에게 이유를 물어본다.', '역할을 나누다 서로 감정이 상하면 상대의 생각을 들으려고 대화를 청한다.', '역할을 나누다 다툼이 생기면 상대에게 이유를 묻는 대화는 피하는 편이다.'],
      [-1, '서운한 말을 들으면 그 이야기를 당사자에게 다시 꺼내지 않는다.', '상대의 말에 서운함이 남더라도 그 사람과 그 일을 이야기하는 자리는 피한다.', '상대의 말이 서운했다면 당사자와 그 말에 대해 이야기한다.'],
      [1, '내 행동을 동료가 오해해 사이가 어색해지면 직접 말을 꺼낸다.', '오해로 동료와 불편해졌다면 그 일부터 함께 이야기해 본다.', '동료가 나를 오해해 사이가 어색해져도 그 일에 대한 대화는 피한다.'],
      [-1, '회의에서 충돌한 안건은 당사자와 다시 이야기하지 않는 쪽이 편하다.', '회의 중 의견이 부딪힌 안건은 상대와 다시 꺼내지 않고 넘어가고 싶다.', '회의에서 의견이 충돌했던 안건은 당사자와 만나 다시 이야기하는 쪽이 편하다.'],
      [1, '함께 정한 일정에 불만이 쌓이면 상대와 그 이유를 이야기한다.', '공동 일정에 마음이 상하면 관련된 사람과 이유를 짚어 보는 편이다.', '공동 일정 때문에 마음이 상해도 그 문제를 당사자와 이야기하는 일은 피한다.']
    ],
    procedure: [
      [1, '순서를 바꿔도 되는 정리 작업에서 나는 대개 정해 둔 순서를 따른다.', '정리 순서에 재량이 있어도 평소에는 약속한 순서를 먼저 택한다.', '순서를 조정해도 되는 정리 작업이라면 그날 상황에 맞게 순서를 바꾼다.'],
      [-1, '형식을 바꿔도 되는 메모는 읽을 사람에 맞춰 항목을 조정한다.', '구성에 재량이 있는 메모는 받는 사람에 따라 형식을 바꾸는 편이다.', '형식을 자유롭게 정할 수 있는 메모도 기존에 쓰던 양식을 우선한다.'],
      [1, '진행 순서가 권고 사항인 모임에서도 기본 순서를 우선해 진행한다.', '모임 순서를 조정할 수 있어도 나는 권고된 순서대로 진행하는 편이다.', '모임 순서에 재량이 있다면 현장 사정에 맞춰 순서를 정하는 편이다.'],
      [-1, '자료를 묶는 방식이 자유라면 자료 성격에 맞춰 분류법을 바꾼다.', '분류에 재량이 있는 자료는 내용에 따라 기존 분류 방식을 조정한다.', '자료 분류에 재량이 있어도 기존에 정해 둔 분류 기준을 우선 적용한다.'],
      [1, '수정이 허용된 회의록도 기본 서식을 유지하는 편이다.', '회의록 양식을 자유롭게 바꿀 수 있어도 보통 기본 틀을 그대로 쓴다.', '회의록 양식에 재량이 있으면 회의 내용에 맞게 틀을 바꿔 쓴다.'],
      [-1, '자리가 자유로운 행사에서는 기본 배치보다 그날 참석자 수에 맞춰 의자를 놓는다.', '배치에 재량이 있는 행사라면 그날 인원에 맞는 자리 배치를 먼저 생각한다.', '배치가 자유로운 행사에서도 웬만하면 기본 자리 배치대로 의자를 놓는다.'],
      [1, '가진 자료를 보여 주는 순서는 자유여도 평소 정해 둔 방식을 먼저 따른다.', '자료 제시 순서를 바꿔도 될 때에도 보통은 기본 순서에 맞춘다.', '자료 제시 순서가 자유라면 그날 청중에 맞게 순서를 조정한다.']
    ],
    team: [
      [1, '분량이 비슷하면 둘이 함께 맡는 작업이 혼자 맡는 작업보다 편하다.', '할 일의 양이 같다면 짝을 이뤄 일하는 쪽이 수월하게 느껴진다.', '분량이 같은 일이라면 짝과 함께할 때보다 혼자 맡을 때 더 편하다.'],
      [-1, '초안을 만들 때는 누군가와 같이 앉기보다 혼자 쓰는 편이 좋다.', '첫 초안을 잡는 일은 다른 사람과 함께하기보다 나 혼자 하는 쪽이 편하다.', '첫 초안을 쓸 때는 혼자 쓰기보다 다른 사람과 같이 만드는 편이 좋다.'],
      [1, '자료를 분류할 때면 혼자 조용히 하기보다 옆 사람과 함께하는 게 편하다.', '자료 분류는 다른 사람과 짝지어 할 때 더 편하게 느껴진다.', '자료를 분류하는 일은 짝과 하기보다 혼자 하는 쪽이 더 편하다.'],
      [-1, '계획안을 짜야 하면 여럿이 한자리에 모이기보다 혼자 구성하는 게 편하다.', '계획안의 틀을 잡는 일은 여럿이 함께할 때보다 혼자 할 때가 편하다.', '계획안의 틀은 혼자서보다 다른 사람과 함께 짤 때 더 편하다.'],
      [1, '전시를 준비할 때면 혼자 꾸미기보다 다른 사람과 같이 꾸미고 싶다.', '전시 준비는 혼자 맡을 때보다 여럿이 함께 맡을 때가 더 즐겁다.', '전시 준비는 여럿이 같이 하기보다 내가 혼자 맡는 편이 좋다.'],
      [-1, '정보를 조사할 때는 둘이 함께 찾아보기보다 혼자 찾아보는 게 편하다.', '조사 작업은 다른 사람과 붙어 하는 것보다 혼자 할 때 마음이 편하다.', '정보를 알아보는 일은 혼자 하기보다 둘이 같이 찾는 편이 편하다.'],
      [1, '발표 연습은 혼자보다 동료와 같이 하는 쪽이 편하다.', '동료와 나란히 발표를 연습할 때 혼자 할 때보다 마음이 편하다.', '발표를 연습하는 자리에서는 다른 사람과 함께할 때보다 혼자일 때가 편하다.']
    ],
    pressure: [
      [1, '남은 시간이 갑자기 줄어도 마음은 대체로 차분한 편이다.', '마감까지 시간이 줄었다는 말을 들어도 내 마음은 보통 차분하다.', '남은 시간이 갑자기 짧아지면 마음이 불안해진다.'],
      [-1, '여러 사람이 동시에 답을 기다리면 마음이 조급해진다.', '여럿이 한꺼번에 내 답을 기다릴 때면 불안이 커지는 편이다.', '여러 사람이 동시에 내 답을 기다려도 보통 차분함을 유지한다.'],
      [1, '중요한 일정을 앞두고 재촉을 받아도 마음을 차분히 유지한다.', '중요한 일 직전에 누가 재촉하더라도 대개 마음은 가라앉아 있다.', '중요한 일정 직전에 재촉을 받으면 마음이 크게 조급해진다.'],
      [-1, '사람들이 지켜보는 앞에서 손으로 작업하면 긴장이 올라간다.', '작업하는 손을 여럿이 지켜보면 마음이 불안해지는 편이다.', '사람들이 내 손작업을 지켜봐도 마음은 비교적 차분하다.'],
      [1, '갑작스레 일이 몰려도 내 마음은 대체로 차분하다.', '일이 한꺼번에 밀려와도 마음이 크게 흔들리지 않는 편이다.', '갑작스레 일이 한꺼번에 몰리면 마음이 쉽게 불안해진다.'],
      [-1, '예상하지 못한 질문을 바로 받으면 마음이 조급해진다.', '갑작스러운 질문에 곧바로 답해야 하면 불안해지는 편이다.', '예상 밖의 질문에 바로 답해야 해도 마음은 차분한 편이다.'],
      [1, '중요한 결과를 기다릴 때도 평소의 차분함을 유지하는 편이다.', '중요한 결과가 곧 나온다는 상황에서도 내 마음은 대체로 안정돼 있다.', '중요한 결과를 기다리는 동안에는 마음이 불안한 편이다.']
    ]
  };

  // 마지막 Part 1 묶음에 넣는 별도 상황이다. 같은 차원이라는 이유만으로 역문항 짝을 만들지 않는다.
  const additional = [
    [1, '새 수업의 첫날에는 내가 먼저 옆 사람에게 수업을 고른 이유를 묻는다.'],
    [-1, '휴가 중 한 끼를 고를 때는 생소한 메뉴보다 익숙한 음식이 당긴다.'],
    [1, '긴 글을 써야 할 때는 단락의 순서를 먼저 적으면 마음이 놓인다.'],
    [-1, '내 실수로 빠진 물품을 발견하면 주변에 알리기보다 내가 먼저 찾아본다.'],
    [1, '함께 일하다 감정이 상한 채 헤어졌다면 다음 날 먼저 그 일을 이야기한다.'],
    [-1, '인쇄물의 배열이 자유롭다면 보는 사람의 관심사에 맞춰 순서를 잡는다.'],
    [1, '행사 물품을 준비할 때는 혼자 챙기기보다 누군가와 나누어 챙기는 게 좋다.'],
    [-1, '일이 예정보다 늦고 있다는 연락을 받으면 마음부터 급해지는 편이다.']
  ];

  // 추정: 절대적인 긍정 진술에 대한 동의를 세는 연습이다. 한 응답의 진실성은 판정할 수 없다.
  // 감정·도덕성처럼 여덟 기준과 직접 대응하지 않는 내용은 dim을 비워 둔다.
  const idealized = [
    [null, 1, '손해를 본 날에도 남의 좋은 소식을 부러워한 적이 단 한 번도 없다.'],
    [null, 1, '내가 정한 사소한 약속까지도 지금껏 모두 제시간에 지켰다.'],
    [null, 1, '누가 내 말을 잘못 알아들어도 나는 평생 한 번도 답답해한 적이 없다.'],
    [null, 1, '남의 긴 설명을 들으면서 잠깐이라도 딴생각을 한 적이 없다.'],
    [null, 1, '누구에게든 고마운 일이 있으면 단 한 번도 잊지 않고 제때 감사를 표현했다.'],
    [null, 1, '아무도 보지 않을 때조차 내 편의를 먼저 생각한 순간은 한 번도 없다.'],
    ['disclosure', 1, '지금까지 내가 낸 실수는 크기와 상관없이 발견한 바로 그 순간 모두 알렸다.'],
    [null, 1, '지루한 이야기까지도 한 번도 끊지 않고 언제나 끝까지 들어 왔다.'],
    [null, 1, '누군가를 처음 보고 성급하게 단정한 적은 지금까지 단 한 번도 없다.'],
    [null, 1, '내 몫의 수고를 실제보다 조금이라도 크게 말해 본 적이 없다.'],
    ['pressure', 1, '큰 압박을 받은 모든 순간에 한 번의 예외도 없이 평정심을 지켰다.'],
    [null, 1, '내가 한 말이 다른 사람에게 상처가 될 수 있다는 점을 한 번도 뒤늦게 깨달은 적이 없다.']
  ];

  // 추정: 부정·극단 진술은 Part 2의 말투와 속도에 익숙해지기 위한 창작이다.
  // 외로움은 혼자 일하기 선호와, 분노는 갈등 대화 선호와 다르므로 서로 대응시키지 않는다.
  const difficult = [
    [null, -1, '좋아하던 일을 해도 마음이 전혀 움직이지 않는 날이 이어진다.'],
    ['pressure', -1, '마감이 가까워지면 아직 벌어지지 않은 문제까지 한꺼번에 걱정한다.'],
    [null, -1, '다른 사람들 틈에 함께 있어도 나만 그 자리에 속하지 못한 느낌이 든다.'],
    [null, -1, '작은 지적만 들어도 금방 화가 치밀어 목소리가 커진다.'],
    [null, -1, '상대가 아무 뜻 없이 건넨 말에도 나를 깎아내릴 속셈이 있다고 여긴다.'],
    [null, -1, '사소한 실수 하나가 떠오르면 그날 잘한 일까지 모두 소용없게 느껴진다.'],
    ['conflict', -1, '불편한 대화를 피하려고 당사자가 보낸 연락을 계속 열어 보지 않는다.'],
    ['disclosure', -1, '내가 만든 문제를 스스로 해결하지 못해도 남이 알아낼 때까지 말하지 않는다.'],
    [null, -1, '억울한 일이 하나 생기면 그 뒤에 하는 일마다 마음을 쏟기 어렵다.'],
    [null, -1, '기대했던 소식이 와도 기쁜 마음이 잠깐도 들지 않을 때가 많다.'],
    ['pressure', -1, '여러 사람 앞에서 답해야 하는 순간이면 걱정 때문에 질문조차 놓친다.'],
    [null, -1, '내 이야기를 듣고 싶어 하는 사람이 아무도 없다는 생각이 자꾸 든다.'],
    [null, -1, '기분이 상하면 상황을 알아보기 전에 가시 돋친 말부터 내뱉는다.'],
    [null, -1, '동료가 내 수고를 칭찬하면 다른 의도가 있을 거라는 생각부터 든다.'],
    [null, -1, '한 번 창피했던 일은 오래 지나도 막 일어난 일처럼 나를 괴롭힌다.'],
    [null, -1, '일이 한 번 틀어지면 다시 해 볼 생각을 통째로 접어 버린다.'],
    ['disclosure', -1, '함께 쓰는 기록을 내가 잘못 고쳤어도 들키기 전에는 입을 다문다.'],
    [null, -1, '내 기분이 상한 날에는 아무 관련 없는 사람에게까지 쌀쌀맞게 대한다.'],
    [null, -1, '무엇을 해도 별 의미가 없다는 생각으로 하루를 시작할 때가 잦다.'],
    [null, -1, '평소와 다를 것이 없는 아침에도 나쁜 일이 닥칠 것 같아 불안하다.'],
    [null, -1, '도움을 청할 만한 사람이 바로 옆에 있어도 세상에 혼자 남은 듯하다.'],
    [null, -1, '누군가 내 차례를 놓치면 사소한 착오여도 화를 가라앉히기 어렵다.'],
    [null, -1, '단체 대화에서 잠깐 답이 끊기면 사람들이 나를 빼려는 것 같다고 여긴다.'],
    [null, -1, '이미 잘 마무리된 일도 내가 망칠 뻔했다는 생각에 밤새 곱씹곤 한다.'],
    [null, -1, '한 번 기대에 못 미치면 이후의 노력은 무엇을 해도 헛되게 느껴진다.'],
    [null, -1, '내게 불리한 평가를 받으면 잘못한 사람이 따로 있는 듯 이야기하고 싶어진다.'],
    [null, -1, '상대가 사과해도 기분이 풀릴 때까지 계속해서 흠을 잡는다.'],
    [null, -1, '하루 동안 있었던 좋은 일은 떠오르지 않고 서운한 일만 남을 때가 잦다.'],
    ['pressure', -1, '평가 결과를 기다리는 동안 걱정이 커져 다른 일에 손을 대기 어렵다.'],
    [null, -1, '가까운 사람이 곁에 있어도 내 마음을 알아줄 사람은 없다고 느낀다.'],
    [null, -1, '내 제안이 거절되면 화가 나서 나머지 이야기를 듣지도 않는다.'],
    [null, -1, '상대가 약속에 조금 늦으면 나를 일부러 무시한 것이라고 단정한다.'],
    [null, -1, '낮에 들은 지적이 머릿속에서 떠나지 않아 밤에도 여러 번 되짚는다.'],
    ['conflict', -1, '의견이 부딪힌 상대와 마주칠까 봐 필요한 대화도 자꾸 미룬다.'],
    [null, -1, '원하는 답을 듣지 못하면 화가 가라앉기도 전에 하던 일을 그만둬 버린다.'],
    [null, -1, '나만 손해 본다고 느끼면 다른 사람의 노력까지 깎아내리는 말을 한다.'],
    [null, -1, '기운이 가라앉으면 늘 하던 작은 일조차 시작하기 버거운 날이 많다.'],
    ['pressure', -1, '급한 요청이 겹치면 불안한 생각에 빠져 어느 것부터 할지도 보이지 않는다.'],
    [null, -1, '다 같이 나눈 대화를 떠올려 보면 나만 겉돌았다는 느낌이 오래 남는다.'],
    [null, -1, '내가 하던 일을 누가 잠깐 끊으면 별일 아닌 줄 알면서도 버럭한다.'],
    [null, -1, '두 사람이 작은 소리로 대화하는 걸 보면 내 이야기를 하는 것이라고 여긴다.'],
    [null, -1, '한 번 실망한 일은 다른 일이 잘 풀려도 온종일 머릿속을 떠나지 않는다.'],
    [null, -1, '계획대로 되지 않은 일이 하나만 있어도 그날 전체를 실패로 여긴다.'],
    [null, -1, '남이 내 공을 알아주지 않으면 다음에는 일부러 협조하지 않으려 한다.'],
    [null, -1, '상대의 말에 기분이 상하면 똑같이 기분 나쁘게 해 주고 싶어진다.']
  ];

  const familyKeys = new Map();
  const families = dimensions.map(({ id: dim }) => wording[dim].map(([direction, ...texts], index) => {
    const key = dim + '-' + (index + 1);
    return texts.map((text, variant) => {
      const id = key + '-' + variant;
      familyKeys.set(id, key);
      return { id, text, dim, dir: variant === 2 ? -direction : direction, kind: 'trait' };
    });
  }));

  function familyOf(item) {
    return item ? familyKeys.get(item.id) || null : null;
  }

  const extras = additional.map(([dir, text], i) => ({
    id: 'extra-' + i, text, dim: dimensions[i].id, dir, kind: 'trait'
  }));

  function singleItems(rows, kind) {
    return rows.map(([dim, dir, text], i) => ({ id: kind + '-' + i, text, dim, dir, kind }));
  }

  const lies = singleItems(idealized, 'lie');
  const negatives = singleItems(difficult, 'neg');

  function inThrees(items) {
    const groups = [];
    for (let i = 0; i < items.length; i += 3) groups.push(items.slice(i, i + 3));
    return groups;
  }

  // 추정: 3~5회 반복은 요청받은 연습 규칙이다. 같은 문장은 같은 id를 유지하고 응답은 등장 위치별로 받는다.
  // 한 주제는 5번, 그중 같은 방향은 4번이다. 일부 기준 문장은 글자 그대로 4번 등장한다.
  const variants = [
    [0, 0, 2, 0, 0],
    [0, 1, 2, 1, 0],
    [0, 2, 0, 1, 0]
  ];

  function fullPlan() {
    const statements = [];
    const carried = [];
    // 8개 차원씩 여섯 번 돈다. 각 차원의 순서를 바꿔도 한 묶음의 세 문장은 서로 다른 차원이다.
    const strides = [1, 3, 5, 7, 3];
    for (let round = 0; round < 5; round++) {
      for (let band = 0; band < 6; band++) {
        for (let position = 0; position < 8; position++) {
          const dim = (position * strides[round] + round) % 8;
          const facet = (band + dim) % 6;
          const family = families[dim][facet];
          const item = family[variants[(dim + facet) % variants.length][round]];
          if (round === 4 && facet === 5) {
            carried.push(item);
            statements.push(extras[dim]);
          } else {
            statements.push(item);
          }
        }
      }
    }

    // Part 2에도 8개 기준의 보통 문항을 섞고 Part 1의 여덟 문장을 다시 보여 준다.
    const specials = [];
    for (let i = 0; i < lies.length; i++) {
      specials.push(lies[i]);
      if (i % 3 !== 2) specials.push(carried.shift());
    }
    const p2 = [];
    const repeatNegatives = negatives.filter((_, i) => i % 3 === 0);
    const singleNegatives = negatives.filter((_, i) => i % 3 !== 0);
    let whichNegative = 0;
    let repeated = 0;
    let single = 0;
    let whichSpecial = 0;
    const pattern = 'NTNSNTNTNN' + 'NTSNNTNNTN' + 'NSNTNNSNTN';
    for (let round = 0; round < 5; round++) {
      let trait = 0;
      for (const type of pattern) {
        if (type === 'N') {
          // 45개 중 15개는 떨어진 위치에 총 4회, 나머지 30개는 한 번씩 놓는다.
          if (whichNegative++ % 3 === 1) p2.push(singleNegatives[single++]);
          else p2.push(repeatNegatives[(repeated++ * 7) % repeatNegatives.length]);
        } else if (type === 'S') {
          p2.push(specials[whichSpecial++]);
        } else {
          const dim = (trait++ + round) % 8;
          p2.push(families[dim][6][variants[dim % variants.length][round]]);
        }
      }
    }
    return { p1: inThrees(statements), p2 };
  }

  function shortPlan() {
    const statements = [];
    const selected = Array.from({ length: 15 }, (_, i) => {
      const dim = i % 8;
      return families[dim][(Math.floor(i / 8) + dim) % 2];
    });
    for (let round = 0; round < 3; round++) {
      for (let i = 0; i < selected.length; i++) {
        const family = selected[(i + 4 * round) % selected.length];
        statements.push(family[round]);
      }
    }

    const p2 = [];
    let trait = 0;
    let negative = 0;
    let lie = 0;
    // 8개 첫 기준 문장을 Part 2에 재배치해 짧게 풀어도 동일 문장·정역 문장 비교가 모두 가능하다.
    for (const type of 'NLNTNTNLNT' + 'NTNLNTNNLN' + 'LNTNNTNLNT') {
      if (type === 'N') p2.push(negatives[(negative++ * 7) % negatives.length]);
      else if (type === 'L') p2.push(lies[(lie++ * 5) % lies.length]);
      else p2.push(selected[(trait++ * 3) % 8][0]);
    }
    return { p1: inThrees(statements), p2 };
  }

  function makePlan(mode) {
    if (mode === 'short') return shortPlan();
    if (mode === 'full') return fullPlan();
    throw new RangeError('연습 모드를 확인해 주세요.');
  }

  const bank = { dimensions, makePlan, familyOf };
  root.DeepBank = bank;
  if (typeof module !== 'undefined' && module.exports) module.exports = bank;
})(globalThis);

// 아래 수치와 비교법은 연습용 추정 기준이다. SK의 채점 기준은 공개되지 않았다.
globalThis.DeepBank.analyze = function analyze(session) {
  const bank = globalThis.DeepBank;
  const { plan } = session;
  const total1 = plan.p1.reduce((sum, group) => sum + group.length, 0);
  const total = total1 + plan.p2.length;
  const halfStart = Math.floor(total / 2) + 1;
  const byId = new Map();
  const byFamily = new Map();
  const axisTotals = new Map(bank.dimensions.map(dim => [dim.id, { sum: 0, count: 0 }]));
  const same = [], lateFlips = [], reverse = [], rank = [];
  const compared = { same: 0, reverse: 0, rank: 0 };
  const missing = { ratings1: 0, ratings2: 0, ratings: 0, near: 0, far: 0, ranks: 0 };
  const lie = { high: 0, answered: 0 };
  const ends = { count: 0, answered: 0, ratio: null };
  let seen = 0;

  function add(map, key, value) {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(value);
  }

  function read(item, raw, part, group, row) {
    const number = ++seen;
    if (!Number.isInteger(raw) || raw < 1 || raw > 6) {
      if (part === 1) missing.ratings1++;
      else missing.ratings2++;
      return null;
    }
    const rec = { id: item.id, text: item.text, value: raw, part, group, row,
                  number, index: part === 1 ? number : number - total1 };
    ends.answered++;
    if (raw === 1 || raw === 6) ends.count++;
    if (!byId.has(item.id)) {
      byId.set(item.id, []);
      const family = bank.familyOf(item);
      if (family && item.kind !== 'lie') add(byFamily, family, item);
    }
    byId.get(item.id).push(rec);
    if (item.kind === 'lie') {
      lie.answered++;
      if (raw >= 5) lie.high++;
    }
    // 과장 및 부정·극단 예시 문항을 성향 점수로 바꾸지 않는다.
    const axis = item.kind === 'trait' && axisTotals.get(item.dim);
    if (axis) {
      axis.count++;
      axis.sum += item.dir === -1 ? 7 - raw : raw;
    }
    return rec;
  }

  plan.p1.forEach((items, g) => {
    const answers = items.map((item, i) =>
      read(item, session.ratings1?.[g]?.[i], 1, g + 1, 'ABC'[i]));
    const { near, far } = session.ranks?.[g] || {};
    const validIndex = i => Number.isInteger(i) && i >= 0 && i < items.length && near !== far;
    if (!validIndex(near)) missing.near++;
    if (!validIndex(far)) missing.far++;
    if (!validIndex(near) || !validIndex(far) || answers.some(answer => !answer)) return;
    compared.rank++;
    const values = answers.map(answer => answer.value);
    const high = Math.max(...values), low = Math.min(...values);
    // 참고용 추정. 동점 최고/최저는 모두 인정하며, 공식적인 일치 규칙은 미확인이다.
    const nearOff = values[near] < high, farOff = values[far] > low;
    if (nearOff || farOff) {
      rank.push({ group: g + 1, near: answers[near], far: answers[far], high, low,
                  nearOff, farOff, items: answers });
    }
  });
  plan.p2.forEach((item, i) => read(item, session.ratings2?.[i], 2, null, null));

  for (const [id, records] of byId) {
    if (records.length < 2) continue;
    compared.same++;
    let biggest = 2, different = null, flip = null;
    for (let j = 1; j < records.length; j++) {
      const last = records[j];
      for (let i = 0; i < j; i++) {
        const first = records[i], distance = Math.abs(last.value - first.value);
        if (distance > biggest) {
          biggest = distance;
          different = { id, text: first.text, first, last };
        }
        if (!flip && distance === 5 && last.number >= halfStart)
          flip = { id, text: first.text, first, last };
      }
    }
    if (different) same.push(different);
    if (flip) lateFlips.push(flip);
  }

  // 명시적으로 짝지은 같은 차원의 역문항만 비교. 양쪽 모두 강한 긍정 또는 강한 부정이면 표시한다.
  for (const [family, items] of byFamily) {
    for (let i = 0; i < items.length; i++) {
      for (const other of items.slice(i + 1)) {
        const item = items[i];
        if (item.dim !== other.dim || item.dir !== -other.dir) continue;
        compared.reverse++;
        let strongest = 0, example = null;
        for (const a of byId.get(item.id)) {
          for (const b of byId.get(other.id)) {
            const samePole = (a.value >= 5 && b.value >= 5) || (a.value <= 2 && b.value <= 2);
            const difference = Math.abs(a.value - (7 - b.value));
            if (!samePole || difference <= strongest) continue;
            strongest = difference;
            const [first, last] = a.number < b.number ? [a, b] : [b, a];
            example = { family, first, last };
          }
        }
        if (example) reverse.push(example);
      }
    }
  }

  const axes = bank.dimensions.map(({ id, name, low, high }) => {
    const { sum, count } = axisTotals.get(id);
    return { id, name, low, high, count, mean: count ? sum / count : null };
  });
  const durations = (session.groupSeconds || []).slice(0, plan.p1.length)
    .filter(s => Number.isFinite(s) && s >= 0);
  const seconds = durations.reduce((sum, s) => sum + s, 0);
  const time = { groups: durations.length, seconds, average: durations.length ? seconds / durations.length : null };
  missing.ratings = missing.ratings1 + missing.ratings2;
  missing.ranks = missing.near + missing.far;
  if (ends.answered) ends.ratio = ends.count / ends.answered;
  return { total, answered: ends.answered, halfStart, same, lateFlips, reverse, rank, lie,
           axes, ends, time, missing, compared };
};
