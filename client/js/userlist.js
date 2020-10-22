let userListModule = (function () {
	let $deleteAll = $('.deleteAll'),
		$selectBox = $('.selectBox'),
		$searchInp = $('.searchInp'),
		$tableBox = $('.tableBox'),
		$tbody = $tableBox.find('tbody'),
		$checkAll = $('#checkAll'),
		$checkList = null;
	//綁定部門信息
	async function bindDepart() {
		let result = await queryDepart();
		if (result.code == 0) {
			let str = ``;
			result.data.forEach(item => {
				str += `<option value="${item.id}">${item.name}</option>`
			});
			$selectBox.append(str)
		}
	}
	//从服务器获取员工列表进行绑定
	async function bindHTML() {
		let params = {
			departmentId: $selectBox.val(),
			search: $searchInp.val().trim()
		}
		let result = await axios.get('/user/list', { params })

		if (result.code != 0) return
		let str = ``
		result.data.forEach(item => {
			let {
				id,
				name,
				sex,
				department,
				job,
				email,
				phone,
				desc

			} = item
			str += `<tr>
			<td class="w3"><input type="checkbox" userId=${id}></td>
			<td class="w10">${name}</td>
			<td class="w5">${sex}</td>
			<td class="w10">${department}</td>
			<td class="w10">${job}</td>
			<td class="w15">${email}</td>
			<td class="w15">${phone}</td>
			<td class="w20">${desc}</td>
			<td class="w12" userId="${id}">
				<a href="javascript:;">编辑</a>
				<a href="javascript:;">删除</a>
				<a href="javascript:;">重置密码</a>
			</td>
		</tr> `
		})
		$tbody.html(str)
		//获取checkbox
		$checkList = $tbody.find('input[type="checkbox"]');

	}
	//搜索触发数据的重新绑定
	function searchHandle() {
		$selectBox.change(bindHTML);
		$searchInp.on('keydown', ev => {
			console.log(ev)
			if (ev.keyCode === 13) {
				//按下的是enter键
				bindHTML()
			}
		})
	}
	//基于事件委托实现需要处理的事情
	function delegate() {
		//委托给tbody
		$tbody.click(async ev => {
			let target = ev.target,
				$target = $(target),
				TAG = target.tagName,
				TEXT = target.innerHTML;
			if (TAG === 'A') {
				let userId = $target.parent().attr('userId')
				if (TEXT === '编辑') {
					window.location.href = `useradd.html?id=${userId}`
					return
				}
				if (TEXT === '删除') {
					//防止误操作，我们在删除前做一个提示
					let flag = confirm(`您确定要删除编号为[${userId}]的信息吗？一旦删除就没了`)
					if (!flag) return;
					let result = await axios.get('/user/delete', {
						params: {
							userId
						}
					})
					if (result.code == 0) {
						alert('删除成功');
						//在页面中移除本条数据
						$target.parent().parent().remove();
						$checkList = $tbody.find('input[type="checkbox"]');
						return;
					}
					alert('当前网络繁忙，请稍后重试~')
					return
				}
				if (TEXT === '重置密码') {
					let flag = confirm(`您确定要为编号[${userId}的员工重置密码吗？]`)
					if (!flag) return;
					let result = await axios.post('/user/resetpassword', {
						params: {
							userId
						}
					})
					if (result.code == 0) {
						alert('密码重置成功');
						return;
					}
					alert('当前网络繁忙，请稍后重试');
					return;
				}
			}
		})
	}

	//全选处理
	function selectHandle() {
		$checkAll.click(ev => {
			let checked = $checkAll.prop('checked');
			$checkList.prop('checked', checked)
		})
		$tbody.click(ev => {
			let target = ev.target,
				tag = target.tagName,
				$target = $(target);
			if (tag === 'INPUT') {
				let flag = true;
				[].forEach.call($checkList, item => {
					if (!$(item).prop('checked')) {
						flag = false
					}
				})
				$checkAll.prop("checked", flag)
			}
		})

		//点击批量删除的时候要获取到哪些checkbox被选中
		$deleteAll.click(ev => {
			//获取当前选中项的员工编号
			let arr = [];
			[].forEach.call($checkList, item => {
				//如果当前项被选中，则把自定义属性userId放到数组中
				if ($(item).prop('checked')) {
					arr.push($(item).attr('userId'))
				}
			});
			//如果没有被选中的要做提示
			if (arr.length === 0) {
				alert('请先选中要删除的项');
				return
			}
			//删除前提示
			let flag = confirm(`您确定要删除这${arr.length}条数据吗？`)
			if (!flag) return;
			//删除选中的数据
			let index = -1;
			//刪除結束要做的事情
			let complete = () => {
				if (index >= arr.length) {
					alert(`已經成功刪除選中的數據`)
				} else {
					alert(`已經爲您刪除了${index + 1}條數據，删除过程中遇到部分信息无法删除，已经为您结束删除操作`)
				}
				//重新数据绑定
				bindHTML()
			}
			let send = async () => {
				if (index >= arr.length) {
					//表示全部删除了
					return;
				}
				let userId = arr[++index]
				let result = await axios.get('/user/delete', {
					params: {
						userId
					}
				});

				if (result.code != 0) {
					//表示当前项删除遇到错误
					return;
				}
				send()
			};
			send()
		})
	}

	return {
		init() {
			bindDepart();
			bindHTML();
			//搜索触发数据的重新绑定
			searchHandle();
			delegate();
			selectHandle();
		}
	}
})();
userListModule.init();