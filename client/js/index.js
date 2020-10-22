let indexModule = (function () {
	let $baseBox = $('.baseBox'),
		$baseBoxText = $baseBox.find('span'),
		$baseBoxSignout = $baseBox.find('a'),
		$menuBox = $('.menuBox'),
		$navBoxList = $('.navBox > a'),
		$itemBoxList = null,
		$iframeBox = $('.iframeBox')

	//基于发布订阅管理我们获取到个人信息和权限信息后要处理的事情
	let $plan = $.Callbacks() //jquery的订阅

	//显示欢迎的基本信息和退出登录，点击退出按钮清空缓存的信息
	$plan.add((_, baseInfo) => {
		$baseBoxText.html(`您好：${baseInfo.name || ''}`)
		$baseBoxSignout.click(async () => {
			let result = await axios.get('user/signout');
			if (result.code == 0) {
				//清除之前本地缓存的所有数据信息
				localStorage.clear();
				window.location.href = 'login.html';
				return
			}
			alert('当前网络繁忙，请稍后再试')
		})
	})

	//权限处理(控制左侧menu的渲染内容)
	$plan.add((power) => {
		let str = ``;
		if (power.includes('userhandle')) {
			str += `<div class="itemBox" text="员工管理">
			<h3>
				<i class = "iconfont icon-yuangong"></i>
				员工管理
			</h3>
			<nav class="item">
				<a href="page/userlist.html" target="iframeBox">员工列表</a>
				<a href="page/useradd.html" target="iframeBox">新增员工</a>
			</nav>
			</div>`
		}
		if (power.includes('departhandle')) {
			str += `<div class="itemBox" text="部门管理">
			<h3>
				<i class = "iconfont icon-guanliyuan"></i>
				部门管理
			</h3>
			<nav class="item">
				<a href="page/departmentlist.html" target="iframeBox">部门列表</a>
				<a href="page/departmentadd.html" target="iframeBox">新增部门</a>
			</nav>
			</div>`
		}
		if (power.includes('jobhandle')) {
			str += `<div class="itemBox" text="职务管理">
			<h3>
				<i class = "iconfont icon-zhiwuguanli"></i>
				职务管理
			</h3>
			<nav class="item">
				<a href="page/joblist.html" target="iframeBox">职务列表</a>
				<a href="page/jobadd.html" target="iframeBox">新增职务</a>
			</nav>
			</div>`
		}
		if (power.includes('customer')) {
			str += `<div class="itemBox" text="客户管理">
			<h3>
				<i class = "iconfont icon-kehuguanli"></i>
				客户管理
			</h3>
			<nav class="item">
				<a href="page/customerlist.html?lx=my" target="iframeBox">我的客户</a>
				${power.includes('customerall') ? `<a href="page/customerlist.html?lx=all" target="iframeBox">全部客户</a>` : ``}
				<a href="page/customeradd.html" target="iframeBox">新增客户</a>
			</nav>
			</div>`
		}

		$menuBox.html(str)
		$itemBoxList = $menuBox.find('.itemBox')
	})

	//控制组织结构和客户管理
	function handleGroup(index) {
		//把itemBox分组  group1客户管理的  group2组织结构的
		let $group1 = $itemBoxList.filter((_, item) => {
			let text = $(item).attr('text');
			return text === '客户管理'
		});
		let $group2 = $itemBoxList.filter((_, item) => {
			let text = $(item).attr('text');
			return /^(员工管理|部门管理|职务管理)/.test(text)
		});
		//控制哪个分组显示
		if (index === 0) {
			$group1.css('display', 'block');
			$group2.css('display', 'none');
		} else if (index === 1) {
			$group2.css('display', 'block');
			$group1.css('display', 'none');
		}
	}
	$plan.add(power => {

		//1.控制默认显示哪一个
		let initialIndex = power.includes('customer') ? 0 : 1;
		$navBoxList.eq(initialIndex).addClass('active').siblings().removeClass('active')
		//控制哪个分组显示
		handleGroup(initialIndex)
		//点击控制切换
		$navBoxList.click(function () {
			let $this = $(this),
				index = $this.index(),
				text = $this.html().trim()
			//每次点击先做权限校验
			if ((text === '客户管理' && !/customer/.test(power)) || (text === '组织结构' && !/(userhandle|departhandle|jobhandle)/.test(power))) {
				alert('无权限访问，请先联系管理员~~')
				return
			}
			//显示的效果
			if (index === initialIndex) return;
			$this.addClass('active');
			$navBoxList.eq(initialIndex).removeClass('active');

			handleGroup(index)
			initialIndex = index

		})
	})
	//权限处理(控制默认iframe嵌套的页面)
	$plan.add(power=>{
		let url = 'page/customerlist.html?lx=my';
		if(!power.includes('customer')){
			url = 'page/userlist.html';
		}
		$iframeBox.attr('src',url)
	})

	//验证当前用户是否登录
	return {
		async init() {
			let result = await axios.get('user/login');
			if (result.code !== 0) {
				//1.未登录，跳转到登录页
				alert('请先登录');
				window.location.href = 'login.html';
				return;
			}
			//2.获取用户的权限信息和个人信息（ajax并行）
			let [power, baseInfo] = await axios.all(
				[
					axios.get('/user/power'),
					axios.get('/user/info')
				]
			)
			power.code == 0 ? power = power.power : null   //权限信息
			baseInfo.code == 0 ? baseInfo = baseInfo.data : null //基本信息

			//3.通知计划表中的方法执行
			$plan.fire(power, baseInfo)
		}
	}
})()
indexModule.init()