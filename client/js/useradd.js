/*
 * 1.进入页面首先要获取部门信息和职务信息，绑定到执行的下拉框中
 * 2.获取到用户输入的信息
 *   格式校验
 *   发送给服务器对应的请求 
 */
let userAddModule = (function () {
	let $username = $('.username'),
		$spanusername = $('.spanusername'),
		$man = $('#man'),
		$woman = $('#woman'),
		$useremail = $('.useremail'),
		$spanuseremail = $('.spanuseremail'),
		$userphone = $('.userphone'),
		$spanuserphone = $('.spanuserphone'),
		$userdepartment = $('.userdepartment'),
		$userjob = $('.userjob'),
		$userdesc = $('.userdesc'),
		$submit = $('.submit'),
		userId = null;
	//绑定部门和职务的信息
	async function bindDepartAndJob() {
		let departmentData = await queryDepart();
		let jobData = await queryJob();
		if (departmentData.code == 0) {
			departmentData = departmentData.data
			//将获取到的部门信息放到下拉框中
			let str = ``;
			departmentData.forEach(item => {
				str += `<option value="${item.id}">${item.name}</option>`
			});
			$userdepartment.html(str)
		}
		if (jobData.code == 0) {
			jobData = jobData.data
			//将获取到的职务信息放到下拉框中
			let str = ``;
			jobData.forEach(item => {
				str += `<option value="${item.id}">${item.name}</option>`
			});
			$userjob.html(str)

		}
	}
	//表单校验
	function checkName() {
		let val = $username.val().trim();
		if (val.length === 0) {
			$spanusername.html('当前是必填项');
			return false
		}
		//判断是不是中文姓名
		if (!/^[\u4E00-\u9FA5]{2,10}(·[\u4E00-\u9FA5]{2，10}){0,2}$/.test(val)) {
			$spanusername.html('请填写真实姓名，2~10位的汉字')
			return false
		}
		$spanusername.html('');
		return true
	}
	//验证邮箱
	function checkEmail() {
		let val = $useremail.val().trim();
		if (val.length === 0) {
			$spanuseremail.html('当前是必填项');
			return false
		}
		//判断是不是中文姓名
		if (!/^\w+((-\w+)|(\.\w+))*@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/.test(val)) {
			$spanuseremail.html('请填写正确的邮箱')
			return false
		}
		$spanuseremail.html('');
		return true
	}
	//验证手机号
	function checkPhone() {
		let val = $userphone.val().trim();
		if (val.length === 0) {
			$spanuserphone.html('当前是必填项');
			return false
		}
		//判断是不是中文姓名
		if (!/^1\d{10}$/.test(val)) {
			$spanuserphone.html('请填写真实手机号码')
			return false
		}
		$spanuserphone.html('');
		return true
	}
	//点击确认提交按钮的时候校验
	async function submitHandle() {
		//重复表单校验
		if (!checkName() || !checkEmail() || !checkPhone()) return
		//获取用户输入的信息
		let params = {
			name: $username.val().trim(),
			sex: $man.prop('checked') ? 0 : 1,//男传0，女传1
			email: $useremail.val().trim(),
			phone: $userphone.val().trim(),
			departmentId: $userdepartment.val(),//通过val拿到下拉框的信息
			jobId: $userjob.val(),
			desc: $userdesc.val().trim()
		}
		//向服务器发送请求(区分新增还是修改)
		if (userId) {
			//修改
			params.userId = userId
			let result = await axios.post('/user/update', params);
			if (result.code == 0) {
				alert('成功修改这条数据');
				window.location.href = 'userlist.html';
				return;
			}
			alert('当前网络繁忙，请稍后重试')
			return
		}
		//新增
		let result = await axios.post('/user/add', params);
		if (result.code == 0) {
			alert('添加用户成功');
			window.location.href = 'userlist.html';
			return;
		}
		alert('当前网络繁忙，请稍后重试')
	}
	//从服务器获取到用户的信息，绑定在对应文本框中
	async function queryBaseInfo() {
		let result = await axios.get('/user/info', {
			params: { userId }
		})
		if (result.code == 0) {
			result = result.data
			//将数据绑定在文本框中
			$username.val(result.name);
			result.sex == 0 ? $man.prop('checked', true) : $woman.prop('checked', true);
			$useremail.val(result.email);
			$userphone.val(result.phone);
			$userdepartment.val(result.departmentId);
			$userjob.val(result.jobId);
			$userdesc.val(result.desc);
			return
		}
		alert('当前要编辑的员工不存在，请查证')
		userId = null  //不存在就当做新增
	}
	return {
		init() {
			bindDepartAndJob()
			//获取到传递的员工id，从而获取员工的信息
			let params = window.location.href.queryURLParams();
			if (params.hasOwnProperty('id')) {
				userId = params.id;
				queryBaseInfo()
			}

			//文本框失去焦点的时候做表单校验
			$username.blur(checkName);
			$useremail.blur(checkEmail);
			$userphone.blur(checkPhone);
			//点击提交按钮
			$submit.click(submitHandle)
		}
	}
})()
userAddModule.init();